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
        skyBox: new Cesium.SkyBox({
          sources: {
            positiveX:
              "https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_px.jpg",
            negativeX:
              "https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mx.jpg",
            positiveY:
              "https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_py.jpg",
            negativeY:
              "https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_my.jpg",
            positiveZ:
              "https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_pz.jpg",
            negativeZ:
              "https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mz.jpg",
          },
        }),
        imageryProvider: new Cesium.UrlTemplateImageryProvider({
          url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        }),
      });

      const viewer = viewerRef.current;
      viewer.scene.globe.enableLighting = false;
      viewer.scene.backgroundColor = Cesium.Color.BLACK;

      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(6.0, 5.0, 1.2e7),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-60),
          roll: 0.0,
        },
        duration: 0,
      });

      // ---- SLOW ROTATION: east -> west (map moves left) ----
      const spinRate = Cesium.Math.toRadians(0.5);
      viewer.clock.onTick.addEventListener((clock: any) => {
        const deltaSeconds = Cesium.JulianDate.secondsDifference(
          clock.currentTime,
          clock.lastTime
        );

        // Rotate camera around Earth's Z axis
        viewer.scene.camera.rotate(
          Cesium.Cartesian3.UNIT_Z,
          -spinRate * deltaSeconds
        );
      });
    };

    const loadCesiumScript = () => {
      if ((window as any).Cesium) {
        initCesium();
        return;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/Widgets/widgets.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src =
        "https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/Cesium.js";
      script.onload = () => {
        (window as any).CESIUM_BASE_URL =
          "https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/";
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

  // ---------- 2) ENTITIES: PIPELINE + INCIDENT AROUND NIGER DELTA ----------
  useEffect(() => {
    if (!viewerRef.current) return;

    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    const viewer = viewerRef.current;

    // Clear old entities
    entitiesRef.current.forEach((entity) => {
      viewer.entities.remove(entity);
    });
    entitiesRef.current = [];

    // Around 4–6°N, 5–7°E
    const pipelineStart = Cesium.Cartesian3.fromDegrees(4.0, 6.0);
    const pipelineEnd = Cesium.Cartesian3.fromDegrees(8.0, 4.5);
    const incidentLocation = Cesium.Cartesian3.fromDegrees(6.0, 5.0);
    const droneBaseLocation = Cesium.Cartesian3.fromDegrees(6.3, 5.5);

    // Pipeline
    const pipeline = viewer.entities.add({
      name: "Pipeline",
      polyline: {
        positions: [pipelineStart, incidentLocation, pipelineEnd],
        width: 3,
        material: Cesium.Color.CYAN.withAlpha(0.7),
      },
    });
    entitiesRef.current.push(pipeline);

    // When we leave idle, zoom into the Niger Delta
    if (sceneId !== "idle") {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(6.0, 5.0, 400000),
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
      const incident = viewer.entities.add({
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

    if (sceneId === "device_cloud" || sceneId === "network_analysis") {
      const devices = [
        { name: "Device A", lon: 5.85, lat: 5.15 },
        { name: "Device B", lon: 6.10, lat: 4.90 },
        { name: "Device C", lon: 6.25, lat: 5.20 },
      ];

      devices.forEach((device) => {
        const entity = viewer.entities.add({
          name: device.name,
          position: Cesium.Cartesian3.fromDegrees(device.lon, device.lat),
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
        entitiesRef.current.push(entity);
      });
    }

    if (sceneId === "drone_deploy" || sceneId === "ethics_wrapup") {
      const startTime = Cesium.JulianDate.now();
      const endTime = Cesium.JulianDate.addSeconds(
        startTime,
        20,
        new Cesium.JulianDate()
      );

      const dronePosition = new Cesium.SampledPositionProperty();
      dronePosition.addSample(startTime, droneBaseLocation);
      dronePosition.addSample(endTime, incidentLocation);

      const drone = viewer.entities.add({
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

      const droneBase = viewer.entities.add({
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

      viewer.clock.startTime = startTime.clone();
      viewer.clock.stopTime = endTime.clone();
      viewer.clock.currentTime = startTime.clone();
      viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
      viewer.clock.shouldAnimate = true;
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
