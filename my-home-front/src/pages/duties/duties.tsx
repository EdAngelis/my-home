import { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Grid } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import FilterListIcon from "@mui/icons-material/FilterList";
import { AppContext } from "../../context";
import IDuties from "../../models/duties.model";
import ICategory from "../../models/category.model";
import IMaker from "../../models/maker.model";
import {
  getDutyState,
  daysRemaining,
  DutyState,
} from "../../shared/duty-status";
import { Dropdown } from "../../components";
import "./duties.css";

import {
  getDuties,
  updateDuty,
  getCategories,
  getMakers,
} from "../../app.service";

const STATUS_LABELS: Record<DutyState, string> = {
  to_make: "To make",
  expire_in: "Expire in",
  paused: "Paused",
};

export default function Duties() {
  const navigate = useNavigate();
  const { userId, defaultHome, homeLoading } = useContext(AppContext);

  const [duties, setDuties] = useState<IDuties[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [makers, setMakers] = useState<IMaker[]>([]);

  const [statusFilter, setStatusFilter] = useState<string>("to_make");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [makerFilter, setMakerFilter] = useState<string>("");

  useEffect(() => {
    if (userId === "") {
      navigate("/");
      return;
    }
    if (homeLoading) return;
    if (defaultHome === "") {
      navigate("/enter-home");
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, defaultHome, homeLoading]);

  const loadAll = async () => {
    try {
      const [dutiesResp, cats, mkrs] = await Promise.all([
        getDuties(userId, defaultHome),
        getCategories(userId),
        getMakers(userId),
      ]);
      setDuties(dutiesResp.data || []);
      setCategories(cats || []);
      setMakers(mkrs || []);
    } catch (error) {
      console.log(error);
    }
  };

  const loadDuties = async () => {
    try {
      const response = await getDuties(userId, defaultHome);
      setDuties(response.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  const categoryName = (id?: string) =>
    categories.find((c) => c._id === id)?.name || "";

  const makerNames = (ids?: string[]) =>
    (ids || [])
      .map((id) => makers.find((m) => m._id === id)?.name)
      .filter(Boolean)
      .join(", ");

  const filtered = useMemo(() => {
    return duties.filter((duty) => {
      if (statusFilter && getDutyState(duty) !== statusFilter) return false;
      if (categoryFilter && duty.category !== categoryFilter) return false;
      if (makerFilter && !(duty.makers || []).includes(makerFilter))
        return false;
      return true;
    });
  }, [duties, statusFilter, categoryFilter, makerFilter]);

  const handleExecution = async (duty: IDuties) => {
    duty.history.unshift({ date: new Date() });
    try {
      await updateDuty(duty, defaultHome);
      await loadDuties();
    } catch (error) {
      console.log(error);
    }
  };

  const goTo = (path: string, params: any) => {
    navigate(path, { state: params });
  };

  const statusBadge = (duty: IDuties) => {
    const state = getDutyState(duty);
    if (state === "expire_in") {
      const days = daysRemaining(duty);
      return `In ${days} ${days === 1 ? "day" : "days"}`;
    }
    return STATUS_LABELS[state];
  };

  return (
    <Grid item className="duties" xs={4}>
      <Grid container className="dutiesHeader">
        <div onClick={() => goTo("/create-duty", null)} className="addBtn">
          <AddCircleIcon />
        </div>
      </Grid>

      <Grid container className="filters">
        <FilterListIcon aria-hidden className="filterIcon" />
        <div className="filterItem">
          <Dropdown
            title="To make"
            hSelection={(item) => setStatusFilter(item.value)}
            options={[
              { label: "All", value: "" },
              { label: "To make", value: "to_make" },
              { label: "Expire in", value: "expire_in" },
              { label: "Paused", value: "paused" },
            ]}
          />
        </div>
        <div className="filterItem">
          <Dropdown
            title="Category"
            hSelection={(item) => setCategoryFilter(item.value)}
            options={[
              { label: "All", value: "" },
              ...categories.map((c) => ({ label: c.name, value: c._id || "" })),
            ]}
          />
        </div>
        <div className="filterItem">
          <Dropdown
            title="Maker"
            hSelection={(item) => setMakerFilter(item.value)}
            options={[
              { label: "All", value: "" },
              ...makers.map((m) => ({ label: m.name, value: m._id || "" })),
            ]}
          />
        </div>
      </Grid>

      <Grid container>
        {filtered.map((duty, index) => (
          <Grid container className="card" key={duty._id || index}>
            <Grid item xs={2} className="cardDone">
              <span className="doneBtn" onClick={() => handleExecution(duty)}>
                Done
              </span>
            </Grid>
            <Grid
              item
              xs={10}
              className="cardBody"
              onClick={() => goTo("/create-duty", duty)}
            >
              <span className="cardName">{duty.name}</span>
              {categoryName(duty.category) && (
                <span className="cardCategory">
                  {categoryName(duty.category)}
                </span>
              )}
              <span className={`cardStatus ${getDutyState(duty)}`}>
                {statusBadge(duty)}
              </span>
              {makerNames(duty.makers) && (
                <span className="cardMakers">{makerNames(duty.makers)}</span>
              )}
            </Grid>
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
}
