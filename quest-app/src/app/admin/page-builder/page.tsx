"use client";
import React from "react";
import { DndContext } from "@dnd-kit/core";
import ComponentList from "./componentList";
import DropZone from "./dropZone";

const PageBuilder: React.FC = () => {
  return (
    <DndContext onDragEnd={(event) => console.log("Dropped", event)}>
      <div style={{ display: "flex", height: "100vh" }}>
        {/* Left Panel: Component List */}
        <div style={{ width: "30%", padding: "10px" }}>
          <ComponentList />
        </div>

        {/* Right Panel: Drop Area */}
        <div style={{ width: "70%", padding: "10px" }}>
          <DropZone />
        </div>
      </div>
    </DndContext>
  );
};

export default PageBuilder;
