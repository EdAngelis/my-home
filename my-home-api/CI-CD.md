# CI/CD — Deploying `my-home-api` to AWS Lambda + API Gateway (SAM + GitHub Actions OIDC)

This documents the CI/CD for **`my-home-api`**, the Express REST API in this
monorepo. The API runs on **AWS Lambda behind an HTTP API Gateway** (via
`serverless-http` — `src/server.ts` exports `handler = serverless(app)`), and is
packaged/deployed with **AWS SAM** (`template.yaml`).

There are two pipelines:

| Pipeline | Trigger | Stack | Purpose |
|---|---|---|---|
| **Production** (`.github/workflows/deploy-api.yml`) | push to `main` **that touches `my-home-api/**`** | `my-home-api` | The live API |
| **Staging** (`.github/workflows/deploy-api-staging.yml`) | pull request to `main` **opened / updated / reopened** touching `my-home-api/**` | `my-home-api-staging` | A throwaway preview API for the PR |

Authentication uses **GitHub OIDC → an AWS IAM role** — no static AWS access keys
are stored in GitHub. The only SAM parameter (`DbUri`) comes from a **GitHub
Secret**, because `samconfig.toml` holds the live connection string and is
gitignored (CI never sees it).

```
push to main (my-home-api/** changed) ─► deploy-api.yml         ─► sam deploy  stack: my-home-api
PR opened/updated (my-home-api/** )    ─► deploy-api-staging.yml ─► sam deploy  stack: my-home-api-staging
                     │
                     └── GitHub OIDC token ──► sts:AssumeRoleWithWebIdentity ──► IAM deploy role
```

### Why the path filter

This is a **monorepo** (`my-home-api` + `my-home-front`). Both workflows filter
on `paths: ["my-home-api/**", <the workflow file>]`, so a commit that only
touches the frontend (or docs at the repo root) **does not** trigger an API
deploy. This is exactly the "change `main` but only the interface → skip the API
deploy" behavior requested.

---

## 1. What's already in the repo

Unlike a green-field setup, the SAM side is **already wired**:

- **`src/server.ts`** exports `export const handler = serverless(app)` and only
  calls `app.listen(...)` when `SERVERLESS !== "true"`, so the same entry point
  runs both locally and in Lambda.
- **`template.yaml`** — one `AWS::Serverless::Function` (`ApiFunction`,
  `Handler: dist/server.handler`, `Runtime: nodejs20.x`) with two `HttpApi`
  events (`/` and `/{proxy+}` `ANY`) that proxy every route to Express. It has a
  single parameter `DbUri` (`NoEcho: true`) and outputs `ApiUrl`.
- **Build** — `npm run build` (`tsc`) emits `dist/`; `sam build` then packages it
  (`.samignore` excludes `src`, keeps `dist`). CI runs `npm ci → npm run build →
  sam build → sam deploy`, mirroring the local `npm run sam:deploy`.
- **`samconfig.toml`** — used for **manual local deploys only**; it is
  **gitignored** (`.gitignore`) because its `parameter_overrides` contains the
  real MongoDB URI. CI does not read it — it passes `DbUri` from the secret.

### No `NameSuffix` needed here

The doc this was adapted from used a `NameSuffix` parameter so a staging stack
could coexist with prod. **We don't need it**: `template.yaml` has **no hardcoded
physical names** (no `FunctionName`, no explicit API name — CloudFormation
derives them from logical ids per stack). So the staging stack
(`my-home-api-staging`) gets its own function, its own HTTP API, and its own URL
automatically, just from a different `--stack-name`.

---

## 2. AWS setup (once per account/repo) — **you do this**

### 2.1 Add the GitHub OIDC identity provider (once per AWS account)

AWS Console → **IAM → Identity providers → Add provider**:

- Type: **OpenID Connect**
- Provider URL: `https://token.actions.githubusercontent.com` → **Get thumbprint**
- Audience: `sts.amazonaws.com`

Skip if the provider already exists in the account.

### 2.2 Create the deploy IAM role

IAM → **Roles → Create role → Custom trust policy**. A role has **two** policy
documents: the *trust policy* (who may assume it) and the *permissions policy*
(what it may do).

**Trust policy** — the `sub` list needs **both** entries: pushes to `main`
(production) present `ref:refs/heads/main`, while `pull_request` runs (staging)
present the distinct subject `repo:EdAngelis/my-home:pull_request`:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike": {
        "token.actions.githubusercontent.com:sub": [
          "repo:EdAngelis/my-home:ref:refs/heads/main",
          "repo:EdAngelis/my-home:pull_request"
        ]
      }
    }
  }]
}
```

**Permissions policy** — attach as an inline policy (covers what `sam deploy`
needs for a Lambda + HTTP API stack; tighten later if desired):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "Cfn",       "Effect": "Allow", "Action": "cloudformation:*", "Resource": "*" },
    { "Sid": "Lambda",    "Effect": "Allow", "Action": "lambda:*",         "Resource": "*" },
    { "Sid": "ApiGw",     "Effect": "Allow", "Action": "apigateway:*",     "Resource": "*" },
    { "Sid": "Logs",      "Effect": "Allow", "Action": "logs:*",           "Resource": "*" },
    { "Sid": "SamBucket", "Effect": "Allow", "Action": "s3:*",
      "Resource": ["arn:aws:s3:::aws-sam-cli-managed-*", "arn:aws:s3:::aws-sam-cli-managed-*/*"] },
    { "Sid": "Iam", "Effect": "Allow",
      "Action": ["iam:CreateRole","iam:DeleteRole","iam:GetRole","iam:PassRole","iam:TagRole","iam:UntagRole",
                 "iam:AttachRolePolicy","iam:DetachRolePolicy","iam:PutRolePolicy","iam:DeleteRolePolicy",
                 "iam:GetRolePolicy","iam:ListRolePolicies","iam:ListAttachedRolePolicies"],
      "Resource": "*" }
  ]
}
```

Name the role (e.g. `my-home-api-gha-deploy`) and **copy its ARN** — it becomes
the `AWS_DEPLOY_ROLE_ARN` GitHub secret.

---

## 3. GitHub repository secrets — **you do this**

GitHub repo → **Settings → Secrets and variables → Actions → New repository
secret**:

| Secret | Value |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | ARN of the role from §2.2 |
| `DB_URI` | MongoDB connection string (the value currently in `samconfig.toml`) |

⚠️ Every secret referenced in a workflow's `--parameter-overrides` must exist. A
missing secret expands to `DbUri=` (empty) and `sam deploy` fails with
`Invalid value for '--parameter-overrides'`.

> 🔒 The MongoDB URI in `samconfig.toml` is a live Atlas credential. Consider
> **rotating it** in Atlas and using the fresh value as the `DB_URI` secret, and
> ideally point staging at a **separate database** (see §6).

---

## 4. The production workflow

`.github/workflows/deploy-api.yml` (already committed). Flow:
`checkout → setup-node@20 → npm ci → npm run build → setup-sam →
configure-aws-credentials (OIDC) → sam build → sam deploy → print ApiUrl`.

Key points:
- `on.push.branches: [main]` + `on.push.paths` scoping to `my-home-api/**`.
- `permissions: id-token: write` (OIDC) + `contents: read`.
- `concurrency: deploy-api`, `cancel-in-progress: false` — serialize prod deploys.
- `defaults.run.working-directory: my-home-api` — SAM commands run against the
  API folder's `template.yaml`.
- Deploys `--stack-name my-home-api` with `DbUri=${{ secrets.DB_URI }}`.
- `workflow_dispatch: {}` gives a manual **Run workflow** button.

The final step prints the live `ApiUrl` from the stack outputs.

---

## 5. The staging workflow (deploy on PR)

`.github/workflows/deploy-api-staging.yml` (already committed). Differences from
production:

- `on.pull_request.branches: [main]`, default types `opened/synchronize/reopened`
  = created + every push to the PR.
- `permissions` also includes `pull-requests: write` so it can comment the URL.
- `concurrency: deploy-api-staging`, `cancel-in-progress: true` — all PRs share
  one staging stack; a newer push cancels a stale deploy.
- Deploys `--stack-name my-home-api-staging --s3-prefix my-home-api-staging`.
- Reads the `ApiUrl` output and **posts/updates a PR comment** with the staging
  API URL (via `actions/github-script`, upserting a single marker comment).

You can point the frontend's `VITE_API_URL` at that staging URL to test a PR's
API end-to-end before merging.

---

## 6. Notes & recommended hardening

- **Shared database.** Both stacks currently receive the same `DB_URI`, so
  staging writes to the **production database**. For isolation, add a
  `DbUri`-style separate secret (e.g. `DB_URI_STAGING`) and use it in the staging
  workflow, pointing at a different Atlas database/cluster.
- **Forks don't get secrets.** PRs opened from forks receive no secrets, so the
  staging deploy will fail at the AWS credential step — staging only works for
  branches pushed to this repository.
- **Teardown.** The staging stack lingers after a PR merges/closes. Delete it
  manually when unneeded: `aws cloudformation delete-stack --stack-name my-home-api-staging`
  (a `pull_request: closed` cleanup job could automate this later).

---

## 7. Verify

- **Actions tab** → the run should show:
  `checkout → setup-node → npm ci → Build (tsc) → setup-sam →
  configure-aws-credentials → SAM build → SAM deploy → Print API URL`.
- On success, CloudFormation shows the stack `my-home-api` (or
  `my-home-api-staging`) as `UPDATE_COMPLETE` / `CREATE_COMPLETE`.
- From a terminal:
  `gh run list --workflow deploy-api.yml` and
  `gh run view <id> --json jobs --jq '.jobs[0].steps[] | .name + " => " + .conclusion'`.

---

## 8. Gotchas

1. **Trigger branch must be the real default branch.** This repo's default is
   `main`; the trust policy `sub` must use `refs/heads/main` too.
2. **"Re-run jobs" re-uses the workflow yaml from the original run's commit.**
   After fixing a workflow, push a new commit or use **Run workflow** instead of
   re-running.
3. **Empty `--parameter-overrides` value.** An unset `DB_URI` secret expands to
   `DbUri=`, which SAM rejects. The secret must exist.
4. **PR runs present a different OIDC subject** (`repo:EdAngelis/my-home:pull_request`,
   not `ref:refs/heads/...`). Both must be in the trust policy `sub` list or the
   staging pipeline fails at `AssumeRoleWithWebIdentity`.
5. **Path filter gotcha.** If you later move/rename the API folder, update the
   `paths:` filters in **both** workflows or deploys silently stop firing.
6. **Editor warnings `Unable to resolve action actions/checkout@v5`** are offline
   false positives from the YAML language server — ignore them if the run works.

---

## 9. What I need from you (setup checklist)

- [ ] **§2.1** OIDC provider exists in the AWS account.
- [ ] **§2.2** Create the deploy IAM role (trust policy with both `sub` entries +
      permissions policy). Copy its ARN.
- [ ] **§3** Add GitHub secrets: `AWS_DEPLOY_ROLE_ARN` and `DB_URI`.
- [ ] (Recommended) Rotate the MongoDB Atlas credential and use the new value.
- [ ] Merge these workflow files, then push an API change (or use **Run
      workflow**) and watch the Actions run (§7).
