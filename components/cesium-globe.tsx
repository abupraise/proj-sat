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

  const rotationCallbackRef = useRef<any | null>(null);
  const isSpinningRef = useRef<boolean>(true);

  const bloomRef = useRef<any | null>(null);
  const motionBlurRef = useRef<any | null>(null);

  const prevSceneIdRef = useRef<PipelineStepId | null>(null);

  // ----------------- INIT VIEWER + POST-PROCESS -----------------
  useEffect(() => {
    if (!containerRef.current) return;

    const initCesium = () => {
      const Cesium = (window as any).Cesium;
      if (!Cesium) {
        console.error("Cesium not loaded");
        return;
      }
      if (viewerRef.current) return;

      Cesium.Ion.defaultAccessToken =
        process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN ??
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmOTc0ZDcxMy1lZDY1LTQ4NTgtYTJhYi1mODAyM2E0ODE3ODgiLCJpZCI6MzY3NzczLCJpYXQiOjE3NjUyMjMxMjN9.Ie6eWR5nCWznzi1hRDYrAmKwRghbRs680H67tbRsWEc";

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

      // Idle camera: big rotating Earth
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 2.4e7),
        orientation: {
          heading: 0.0,
          pitch: -Cesium.Math.PI_OVER_TWO,
          roll: 0.0,
        },
      });

      // SLOW ROTATION (only when isSpinningRef = true)
      const spinRate = Cesium.Math.toRadians(0.5); // deg / s

      rotationCallbackRef.current = (clock: any) => {
        if (!isSpinningRef.current) return;

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
          spinRate * deltaSeconds // east - west apparent motion
        );
      };

      viewer.clock.shouldAnimate = true;
      viewer.clock.onTick.addEventListener(rotationCallbackRef.current);

      // BLOOM STAGE (disabled by default)
      const bloom = Cesium.PostProcessStageLibrary.createBloomStage();
      bloom.enabled = false;
      bloom.uniforms.glowOnly = false;
      bloom.uniforms.brightness = -0.3;
      bloom.uniforms.contrast = 128.0;
      viewer.scene.postProcessStages.add(bloom);
      bloomRef.current = bloom;

      // SIMPLE MOTION-BLUR-LIKE STAGE (vertical smear)
      const motionBlur = new Cesium.PostProcessStage({
        name: "motionBlurStage",
        fragmentShader: `
          uniform sampler2D colorTexture;
          varying vec2 v_textureCoordinates;
          void main(void) {
            vec2 dir = vec2(0.0, -0.02);
            vec4 sum = vec4(0.0);
            const int SAMPLES = 8;
            for (int i = 0; i < SAMPLES; i++) {
              sum += texture2D(colorTexture, v_textureCoordinates + float(i) * dir);
            }
            gl_FragColor = sum / float(SAMPLES);
          }
        `,
      });
      motionBlur.enabled = false;
      viewer.scene.postProcessStages.add(motionBlur);
      motionBlurRef.current = motionBlur;
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
        if (rotationCallbackRef.current) {
          viewerRef.current.clock.onTick.removeEventListener(
            rotationCallbackRef.current
          );
        }
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // ----------------- ENTITIES + CINEMATIC TRANSITIONS -----------------
  useEffect(() => {
    if (!viewerRef.current) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;
    const viewer = viewerRef.current;

    const prevSceneId = prevSceneIdRef.current;
    const leavingIdle = prevSceneId === "idle" && sceneId !== "idle";

    // Toggle spinning based on scene
    if (sceneId === "idle") {
      isSpinningRef.current = true;
    } else {
      isSpinningRef.current = false;
    }

    // Cross-fade imagery + cinematic zoom on FIRST transition from idle
    if (leavingIdle) {
      const layers = viewer.imageryLayers;
      const baseLayer = layers.length > 0 ? layers.get(0) : null;

      (async () => {
        try {
          // Correct Ion loading
          const ionProvider = await Cesium.IonImageryProvider.fromAssetId(3812);

          const satelliteLayer = layers.addImageryProvider(ionProvider);
          satelliteLayer.alpha = 0.0;

          const fadeDurationMs = 2500;
          const start = performance.now();

          const step = (now: number) => {
            const t = Math.min(1, (now - start) / fadeDurationMs);
            const eased = Cesium.EasingFunction.QUADRATIC_OUT(t);

            satelliteLayer.alpha = eased;
            if (baseLayer) baseLayer.alpha = 1 - eased;

            if (t < 1) {
              requestAnimationFrame(step);
            } else if (baseLayer) {
              baseLayer.alpha = 0.0; // keep transparent to avoid flicker
            }
          };

          requestAnimationFrame(step);
        } catch (err) {
          console.error("Failed to load Cesium Ion imagery", err);
        }
      })();

      // Enable bloom + motion blur briefly during the zoom
      if (bloomRef.current) bloomRef.current.enabled = true;
      if (motionBlurRef.current) motionBlurRef.current.enabled = true;

      const zoomDurationSec = 2.5;

      // More zoomed-in altitude to actually see the pipeline area
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(6.0, 5.0, 50000.0), // was 250000
        orientation: {
          heading: Cesium.Math.toRadians(135),
          pitch: Cesium.Math.toRadians(-60),
          roll: Cesium.Math.toRadians(1.5),
        },
        duration: zoomDurationSec,
        easingFunction: Cesium.EasingFunction.QUADRATIC_OUT,
      });

      setTimeout(() => {
        if (bloomRef.current) bloomRef.current.enabled = false;
        if (motionBlurRef.current) motionBlurRef.current.enabled = false;
      }, zoomDurationSec * 1000 + 300);
    }

    // ---------- CLEAR + REBUILD ENTITIES ----------
    entitiesRef.current.forEach((e) => viewer.entities.remove(e));
    entitiesRef.current = [];

    // Niger Delta region
    const pipelineStart = Cesium.Cartesian3.fromDegrees(4.0, 6.0);
    const pipelineEnd = Cesium.Cartesian3.fromDegrees(8.0, 4.5);
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

    // Camera behaviour (for non-first transitions)
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
    } else if (!leavingIdle) {
      // Later steps: softer re-frames
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(6.0, 5.0, 400000.0),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0.0,
        },
        duration: 1.8,
        easingFunction: Cesium.EasingFunction.QUADRATIC_OUT,
      });
    }

    // Incident marker (no pulse yet)
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

    // Start heartbeat only for later, more “intense” scenes
    if (
      sceneId === "network_analysis" ||
      sceneId === "drone_deploy" ||
      sceneId === "ethics_wrapup"
    ) {
      const startTime = viewer.clock.currentTime;

      const pulseRadius = new Cesium.CallbackProperty((time: any) => {
        const seconds = Cesium.JulianDate.secondsDifference(time, startTime);
        const base = 20000.0;
        const amplitude = 15000.0;
        return base + Math.abs(Math.sin(seconds * 2.5)) * amplitude;
      }, false);

      const pulse = viewer.entities.add({
        position: incidentLocation,
        ellipse: {
          semiMajorAxis: pulseRadius,
          semiMinorAxis: pulseRadius,
          material: Cesium.Color.RED.withAlpha(0.18),
          outline: true,
          outlineColor: Cesium.Color.RED.withAlpha(0.8),
          outlineWidth: 2,
        },
      });
      entitiesRef.current.push(pulse);
    }

    // Device cloud around incident
    if (sceneId === "device_cloud" || sceneId === "network_analysis") {
      const devices = [
        { name: "Device A", lon: 5.85, lat: 5.15 },
        { name: "Device B", lon: 6.1, lat: 4.9 },
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

    // Drone deployment path
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

    prevSceneIdRef.current = sceneId;
  }, [sceneId]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
