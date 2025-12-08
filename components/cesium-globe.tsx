"use client";

import { useEffect, useRef } from "react";
import { PipelineStepId } from "@/lib/pipeline-script";

interface CesiumGlobeProps {
  sceneId: PipelineStepId;
}

export function CesiumGlobe({ sceneId }: CesiumGlobeProps) {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const entitiesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!cesiumContainer.current) return;

    const initCesium = async () => {
      const Cesium = (window as any).Cesium;
      if (!Cesium) {
        console.error("Cesium not loaded");
        return;
      }

      Cesium.Ion.defaultAccessToken =
        process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN ??
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmOTc0ZDcxMy1lZDY1LTQ4NTgtYTJhYi1mODAyM2E0ODE3ODgiLCJpZCI6MzY3NzczLCJpYXQiOjE3NjUyMjMxMjN9.Ie6eWR5nCWznzi1hRDYrAmKwRghbRs680H67tbRsWEc";

      if (viewerRef.current) return;

      viewerRef.current = new Cesium.Viewer(cesiumContainer.current!, {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
      });

      viewerRef.current.scene.globe.enableLighting = false;
      viewerRef.current.scene.backgroundColor = Cesium.Color.BLACK;

      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-95.0, 35.0, 15000000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0.0,
        },
        duration: 0,
      });
    };
    const loadCesiumScript = () => {
      if ((window as any).Cesium) {
        initCesium();
        return;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/Widgets/widgets.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/Cesium.js";
      script.onload = () => {
        (window as any).CESIUM_BASE_URL = "https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/";
        initCesium();
      };
      document.head.appendChild(script);
    };

    loadCesiumScript();

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!viewerRef.current) return;

    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    entitiesRef.current.forEach((entity) => {
      viewerRef.current.entities.remove(entity);
    });
    entitiesRef.current = [];

    const pipelineStart = Cesium.Cartesian3.fromDegrees(-100.0, 36.0);
    const pipelineEnd = Cesium.Cartesian3.fromDegrees(-95.0, 34.0);
    const incidentLocation = Cesium.Cartesian3.fromDegrees(-97.5, 35.0);
    const droneBaseLocation = Cesium.Cartesian3.fromDegrees(-96.0, 35.5);

    const pipeline = viewerRef.current.entities.add({
      name: "Pipeline",
      polyline: {
        positions: [pipelineStart, pipelineEnd],
        width: 3,
        material: Cesium.Color.CYAN.withAlpha(0.7),
      },
    });
    entitiesRef.current.push(pipeline);

    if (sceneId !== "idle") {
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-97.5, 35.0, 500000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0.0,
        },
        duration: 2,
      });
    }

    if (
      sceneId === "incident_detected" ||
      sceneId === "satellite_zoom" ||
      sceneId === "device_cloud" ||
      sceneId === "network_analysis" ||
      sceneId === "drone_deploy" ||
      sceneId === "ethics_wrapup"
    ) {
      const incident = viewerRef.current.entities.add({
        name: "Incident",
        position: incidentLocation,
        point: {
          pixelSize: 15,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: "Incident Location",
          font: "14px sans-serif",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -20),
        },
      });
      entitiesRef.current.push(incident);
    }

    if (
      sceneId === "device_cloud" ||
      sceneId === "network_analysis"
    ) {
      const devices = [
        { name: "Device A", offset: [0.05, 0.05] },
        { name: "Device B", offset: [-0.05, 0.03] },
        { name: "Device C", offset: [0.03, -0.05] },
      ];

      devices.forEach((device) => {
        const deviceEntity = viewerRef.current.entities.add({
          name: device.name,
          position: Cesium.Cartesian3.fromDegrees(
            -97.5 + device.offset[0],
            35.0 + device.offset[1]
          ),
          point: {
            pixelSize: 10,
            color: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 1,
          },
          label: {
            text: device.name,
            font: "12px sans-serif",
            fillColor: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -15),
          },
        });
        entitiesRef.current.push(deviceEntity);
      });
    }

    if (
      sceneId === "drone_deploy" ||
      sceneId === "ethics_wrapup"
    ) {
      const startTime = Cesium.JulianDate.now();
      const endTime = Cesium.JulianDate.addSeconds(
        startTime,
        20,
        new Cesium.JulianDate()
      );

      const dronePosition = new Cesium.SampledPositionProperty();
      dronePosition.addSample(startTime, droneBaseLocation);
      dronePosition.addSample(endTime, incidentLocation);

      const drone = viewerRef.current.entities.add({
        name: "Drone",
        position: dronePosition,
        point: {
          pixelSize: 12,
          color: Cesium.Color.LIME,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: "Drone",
          font: "12px sans-serif",
          fillColor: Cesium.Color.LIME,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -15),
        },
      });
      entitiesRef.current.push(drone);

      const droneBase = viewerRef.current.entities.add({
        name: "Drone Base",
        position: droneBaseLocation,
        point: {
          pixelSize: 10,
          color: Cesium.Color.BLUE,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1,
        },
        label: {
          text: "Base",
          font: "12px sans-serif",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -15),
        },
      });
      entitiesRef.current.push(droneBase);

      viewerRef.current.clock.startTime = startTime.clone();
      viewerRef.current.clock.stopTime = endTime.clone();
      viewerRef.current.clock.currentTime = startTime.clone();
      viewerRef.current.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
      viewerRef.current.clock.shouldAnimate = true;
    }
  }, [sceneId]);

  return (
    <div
      ref={cesiumContainer}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
