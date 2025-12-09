"use client";

import { useEffect, useRef } from "react";
import { PipelineStepId } from "@/lib/pipeline-script";

interface CesiumGlobeProps {
  sceneId: PipelineStepId;
}

export function CesiumGlobe({ sceneId }: CesiumGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any | null>(null);
  const entitiesRef = useRef<any[]>([]);
  const lastTimeRef = useRef<any | null>(null);

  // ----------------- INIT VIEWER + ROTATION -----------------
  useEffect(() => {
    if (!containerRef.current) return;

    const initCesium = () => {
      const Cesium = (window as any).Cesium;
      if (!Cesium) {
        console.error("Cesium not loaded");
        return;
      }
      if (viewerRef.current) return;

      // IMPORTANT: use a real Cesium Ion token here
      Cesium.Ion.defaultAccessToken =
        process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN ??
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmOTc0ZDcxMy1lZDY1LTQ4NTgtYTJhYi1mODAyM2E0ODE3ODgiLCJpZCI6MzY3NzczLCJpYXQiOjE3NjUyMjMxMjN9.Ie6eWR5nCWznzi1hRDYrAmKwRghbRs680H67tbRsWEc";

      // Viewer with default Ion world imagery (no custom UrlTemplate)
      const viewer = new Cesium.Viewer(containerRef.current, {
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
        // no imageryProvider here → Ion world imagery (asset 2) is used
        // keep a starry skybox like EVA_LAND
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
      });

      viewerRef.current = viewer;

      viewer.scene.globe.show = true;
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.globe.enableLighting = false;
      viewer.scene.backgroundColor = Cesium.Color.BLACK;

      // IDLE CAMERA: guaranteed-visible globe
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 2.4e7),
        orientation: {
          heading: 0.0,
          pitch: -Cesium.Math.PI_OVER_TWO,
          roll: 0.0,
        },
      });

      // 🌍 SLOW ROTATION east → west
      const spinRate = Cesium.Math.toRadians(0.5); // degrees / second
      viewer.clock.shouldAnimate = true;
      viewer.clock.onTick.addEventListener((clock: any) => {
        const currentTime = clock.currentTime;

        if (!lastTimeRef.current) {
          lastTimeRef.current = Cesium.JulianDate.clone(currentTime);
          return;
        }

        const deltaSeconds = Cesium.JulianDate.secondsDifference(
          currentTime,
          lastTimeRef.current
        );
        lastTimeRef.current = Cesium.JulianDate.clone(currentTime);

        viewer.scene.camera.rotate(
          Cesium.Cartesian3.UNIT_Z,
          -spinRate * deltaSeconds // negative = east→west apparent motion
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

  // ----------------- ENTITIES + CAMERA PER SCENE -----------------
  useEffect(() => {
    if (!viewerRef.current) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;
    const viewer = viewerRef.current;

    // clear previous entities
    entitiesRef.current.forEach((e) => viewer.entities.remove(e));
    entitiesRef.current = [];

    // Niger Delta region (rough coords)
    const pipelineStart = Cesium.Cartesian3.fromDegrees(4.0, 6.0); // west delta
    const pipelineEnd = Cesium.Cartesian3.fromDegrees(8.0, 4.5);   // east / offshore
    const incidentLocation = Cesium.Cartesian3.fromDegrees(6.0, 5.0);
    const droneBaseLocation = Cesium.Cartesian3.fromDegrees(6.3, 5.5);

    // Pipeline polyline
    const pipeline = viewer.entities.add({
      name: "Pipeline",
      polyline: {
        positions: [pipelineStart, incidentLocation, pipelineEnd],
        width: 3,
        material: Cesium.Color.CYAN.withAlpha(0.7),
      },
    });
    entitiesRef.current.push(pipeline);

    // Camera behaviour:
    //  idle  → wide view (big rotating Earth)
    //  others → zoom to Niger Delta, globe centered
    if (sceneId === "idle") {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 2.4e7),
        orientation: {
          heading: 0.0,
          pitch: -Cesium.Math.PI_OVER_TWO,
          roll: 0.0,
        },
        duration: 1.0,
      });
    } else {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(6.0, 5.0, 4.0e5),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0.0,
        },
        duration: 2.0,
      });
    }

    // Incident marker
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

    // Device cloud
    if (sceneId === "device_cloud" || sceneId === "network_analysis") {
      const devices = [
        { name: "Device A", lon: 5.85, lat: 5.15 },
        { name: "Device B", lon: 6.1,  lat: 4.9 },
        { name: "Device C", lon: 6.25, lat: 5.2 },
      ];

      devices.forEach((d) => {
        const ent = viewer.entities.add({
          name: d.name,
          position: Cesium.Cartesian3.fromDegrees(d.lon, d.lat),
          point: {
            pixelSize: 10,
            color: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 1,
          },
          label: {
            text: d.name,
            font: "12px sans-serif",
            fillColor: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -15),
          },
        });
        entitiesRef.current.push(ent);
      });
    }

    // Drone deployment
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

      const base = viewer.entities.add({
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
      entitiesRef.current.push(base);

      viewer.clock.startTime = startTime.clone();
      viewer.clock.stopTime = endTime.clone();
      viewer.clock.currentTime = startTime.clone();
      viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
      viewer.clock.shouldAnimate = true;
    }
  }, [sceneId]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
