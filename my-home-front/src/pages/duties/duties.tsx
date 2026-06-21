import { useCallback, useEffect, useState } from "react";
import { Grid } from "@mui/material";
import IDuties from "../../models/duties.model";
import dateDifference from "../../shared/dates-interval";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import "./duties.css";

import {
    getDuties,
    updateDuty,
  } from "../../app.service";

export default function Duties() {
  const [pendents, setPendents] = useState<IDuties[]>([]);

  useEffect(() => {
    loadDuties();
  }, []);

  const loadDuties = async () => {
    const response = await getDuties();
    handlePending(response.data);
  };

  const handlePending = useCallback((data: IDuties[]) => {
    const pendents = data.filter((duty) => {
      const dutyFrequency = duty.frequency;
      const lastDutyExecution = duty.history[0].date;
      const daysSinceLastExecution = lastDutyExecution
        ? dateDifference(new Date(), new Date(lastDutyExecution))
        : 199;

      if (daysSinceLastExecution > dutyFrequency) {
        return true;
      }
    });

    setPendents(pendents);
  }, []);

  const handleExecution = async (duty: IDuties) => {
    duty.history.unshift({ date: new Date() });
    try {
      await updateDuty(duty);
      await loadDuties();
    } catch (error) {
      console.log(error);
    }
  };
    return (
        <Grid item className="duties" xs={4}>
          <Grid container>
            <h1>Duties</h1>
            <AddCircleIcon />
          </Grid>
          <Grid container>
            {pendents.map((duty, index) => (
              <Grid container className="table" key={index}>
                <Grid item xs={10}>
                  <span> {duty.name}</span>
                </Grid>
                <Grid item xs={2}>
                  <div
                    onClick={() => {
                      handleExecution(duty);
                    }}
                  >
                    <PlayCircleFilledIcon />
                  </div>
                </Grid>
              </Grid>
            ))}
          </Grid>
        </Grid>
    )
}