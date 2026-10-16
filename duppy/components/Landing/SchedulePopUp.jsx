"use client";

import { PopupWidget } from "react-calendly";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import data from "@/data.json";

const { popup } = data;

const SchedulePopUp = ({ language }) => {
  const [rootElement, setRootElement] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRootElement(document.querySelector("body"));
    }
  }, []);

  // Portal straight into <body> so no section's stacking context can cover it.
  return (
    rootElement &&
    createPortal(
      <PopupWidget
        url="https://calendly.com/dupscaled/free-meeting"
        rootElement={rootElement}
        text={popup[language]}
        textColor="#ffffff"
        color="#6a45ff"
      />,
      rootElement
    )
  );
};

export default SchedulePopUp;
