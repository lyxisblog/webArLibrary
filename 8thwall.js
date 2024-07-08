(function (root, factory) {
    "use strict";
    if (typeof exports === 'object' && typeof module === 'object') {
        // CommonJS (Node.js) environment
        module.exports = factory(exports);
        root.xr8thWall = exports;
    } else if (typeof define === 'function' && define.amd) {
        // AMD (RequireJS) environment
        define(['exports'], factory);
    } else {
        // Browser global (root is the global context, e.g., window)
        factory(root.xr8thWall = {});
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, (function (exports) {

    class SensorsdataGenerator {
        injectSensorsdata() {
            console.log("injectSensorsdatainjectSensorsdatainjectSensorsdatainjectSensorsdatainjectSensorsdata");
            // Init._checkLoadType({ src: `${this._baseOSSUrl}/PluginRepositories/Public/three.min.js`, type: 1, }).then(() => {
            //     this.Sensors = window['sensorsDataAnalytic201505'];
            //     const { Sensors } = this;
            //     console.log("Sensors", this.Sensors);
            //     Sensors.init({
            //         server_url: 'https://gather.gmoregalaxy.com/sa',
            //         is_track_single_page: true,
            //         send_type: 'ajax',
            //         show_log: true,
            //         heatmap: {
            //             // scroll_notice_map: 'default',
            //             // scroll_delay_time: 4000,
            //             // scroll_event_duration: 18000,//单位秒，预置属性停留时长 event_duration 的最大值。默认5个小时，也就是300分钟，18000秒。
            //             clickmap: 'default',
            //             get_vtrack_config: true,
            //             collect_tags: {
            //                 div: true,
            //                 button: true,
            //                 li: true,
            //                 img: true,
            //                 canvas: true
            //             }
            //         },
            //     });

            //     //  公共属性
            //     Sensors.registerPage({
            //         is_login: () => /MicroMessenger/i.test(window.navigator.userAgent),
            //         platform_name: () => /MicroMessenger/i.test(window.navigator.userAgent) == true ? "游历星河小程序" : "H5",
            //         platform_version: () => /MicroMessenger/i.test(window.navigator.userAgent) == true ? "v1.2.5" : "1.2.9",
            //     });

            //     Sensors.quick('autoTrack', { platform: 'h5' });
            // })
        }

        sendSensorsTrack(eventName, propertyObject) {
            // if (this.Sensors && this.Sensors.track) this.Sensors.track(eventName, propertyObject);
        }
    }

    class SpatialRecognition {

        #interface = {
            BASE_URL: `https://meta-h5.shengydt.com/apidata/`,
            SERVER_LOCALIZE: `localize`,
            BASE_URL: "",
            SERVER_LOCALIZE: "",
            TOKEN: null,
            MAP_IDS: [],
            isRecognition: false,
        }

        constructor(config) { }

        setInterface() {
            const { _baseConfig: { recognitionConfig = {} } } = this;
            for (const [key, value] of Object.entries(recognitionConfig)) { this.#interface[key] = value; };
        }

        recognition(callBack, mapId = null) {
            const that = this;
            const { videoWidth, videoHeight, pixelBuffer, cameraIntrinsics, cameraPosition, cameraRotation } = this;
            const { BASE_URL, SERVER_LOCALIZE, TOKEN, MAP_IDS, isRecognition } = this.#interface;
            if (isRecognition) return;
            if (XR8.Threejs.xrScene() == null) return [that._errorsAlert("Deprived XrScene Object", "提示", "Deprived XrScene Object"), this.#interface.isRecognition = false];
            this.#interface.isRecognition = true;
            const { scene, camera, renderer } = XR8.Threejs.xrScene();
            const encodedImage = this.getImageData();
            const jsonData = { token: TOKEN, fx: cameraIntrinsics.fx, fy: cameraIntrinsics.fy, ox: cameraIntrinsics.ox, oy: cameraIntrinsics.oy, param1: 0, param2: 12, param3: 0.0, param4: 2.0, mapIds: mapId == null ? MAP_IDS : [{ id: mapId }] };
            const payload = new Blob([JSON.stringify(jsonData), '\0', encodedImage]);
            console.log("payload", jsonData);
            $.ajax({
                type: "POST",
                url: `${BASE_URL}${SERVER_LOCALIZE}`,
                data: payload,
                processData: false,
                timeout: 50000,
                dataType: "json",
                error: function (data, status, error) {
                    that._baseConfig.debugger == true ? that._errorsAlert("网络似乎不稳定，请重试", "提示", error) : null;
                    that.#interface.isRecognition = false;
                    callBack({ success: false, position: null, rotation: null, scale: null, data: null, error });
                },
                success: function (data) {
                    if (data.success) {
                        that.#interface.isRecognition = false;
                        let position = new THREE.Vector3();
                        let rotation = new THREE.Quaternion();
                        let scale = new THREE.Vector3();

                        const cloudSpace = new THREE.Matrix4();
                        cloudSpace.set(data.r00, -data.r01, -data.r02, data.px,
                            data.r10, -data.r11, -data.r12, data.py,
                            data.r20, -data.r21, -data.r22, data.pz,
                            0, 0, 0, 1);
                        const m = new THREE.Matrix4().multiplyMatrices(camera.matrixWorld.clone(), cloudSpace.invert());
                        m.decompose(position, rotation, scale);
                        renderer.render(scene, camera);

                        callBack({ success: data.success, position, rotation, scale, data });
                        that._baseConfig.debugger == true ? window.mui.toast('识别成功', { duration: 'long', type: 'div' }) : null;
                    }
                    else {
                        // that._baseConfig.debugger == true ? that._errorsAlert("识别失败，请重试", "提示", "识别失败") : null;
                        that._baseConfig.debugger == true ? window.mui.toast('识别失败，请重试', { duration: 'long', type: 'div' }) : null;
                        that.#interface.isRecognition = false;
                        callBack({ success: false, position: null, rotation: null, scale: null, data: null, error: "识别失败，请重试" });
                    }
                }
            })
        }

        getImageData() {
            let buffer = UPNG.encodeLL([this.pixelBuffer], this.videoWidth, this.videoHeight, 1, 0, 8, 0);
            return buffer;
        }

        getTokenAndmapId() {
            this.#interface.TOKEN = SpatialRecognition.getUrlParam("token");
            let mapIds = SpatialRecognition.getUrlParam("mapId")?.split(",") ?? null;
            if (this.#interface.TOKEN == null) {
                return this._errorsAlert("未获取到景区TOKEN,请确定TOKEN信息及确认是否在当前景区内！", "警告", { error: "Deprived TOKEN , Please Check TOKEN" });
            } else if (this.#interface.MAP_IDS.length < 0) {
                return this._errorsAlert("未获取到景区的景点MAPID,请确定MAPID信息及确认是否在当前景区内！", "警告", { error: "Deprived MAPID , Please Check MAPID" });
            }
            for (var i = 0; i < mapIds.length; i++) { this.#interface.MAP_IDS.push({ id: Number(mapIds[i]) }) };

        }

        static getUrlParam(name) {
            let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
            let r = window.location.search.substr(1).match(reg);
            if (r != null) return decodeURIComponent(r[2]); return null;
        }

        static isOperatingSystem() {
            var u = navigator.userAgent;
            if (u.indexOf('Android') > -1 || u.indexOf('Linux') > -1 || u.indexOf('Windows Phone') > -1) {
                return "Android";
            } else if (u.indexOf('iPhone') > -1) {
                return "Ios";
            } else if (u.indexOf("iPad") > -1) {
                return "IPadOS";
            } else if (u.indexOf("ohos")) {
                return "HarmonyOS"
            } else {
                return 'noAndoIos'
            }
        }
    }

    class ImmersalPipeline extends SpatialRecognition {
        inDom = false;
        #startLoadSetInterval = null;
        #isImpowerSetInterval = null;
        #isImpowerSetTimeout = null;
        _baseOSSUrl = "https://metaverse-jwar-release.oss-cn-shanghai.aliyuncs.com/WeChat";

        timeoutCheckConfig = {
            startLoadTime: null,
            currentLoadTime: null,
            secondaryWaiting: false,
            isEstimate: false,
            secondaryWaitingStartTime: 10,
            secondaryWaitingOverTime: 20,
            first: { message: "呀，网络似乎被UFO抢走了，网络并不稳定，您可以选择继续等待。", title: "提示", btnValue: ["重新进入", "继续等待"] },
            twice: { message: "似乎并没有将网络获取权，从UFO手中抢过来，需要重新进入！", title: "提示", btnValue: ["确定"] },
        };

        static xr8PauseOrResumeCb = null;
        static setDisableWorldTracking = null;
        static getDeviceOrientationChange = null;

        #pipelineModuleName = "immersal";
        videoWidth = null;
        videoHeight = null;
        pixelBuffer = null;
        cameraIntrinsics = null;
        cameraPosition = null;
        cameraRotation = null;

        isRun = false;
        isSkyEffects = false;
        skyEffectsConfig = {
            // TEXTURE: "https://8thwall.8thwall.app/sky-effects-threejs/assets/opacity5-d84916o187.png",
            TEXTURE: "https://metaverse-ar-beta.oss-cn-hangzhou.aliyuncs.com/WeChat/PluginRepositories/8thwall/Dev/panorama_image.jpg",
            DOTY_MODEL: "https://metaverse-ar-beta.oss-cn-hangzhou.aliyuncs.com/WeChat/PluginRepositories/8thwall/Dev/cyber_ninja.glb",
            AIRSHIP_MODEL: "https://metaverse-ar-beta.oss-cn-hangzhou.aliyuncs.com/WeChat/PluginRepositories/8thwall/Dev/airship.glb",
            loader: new THREE.GLTFLoader(),
            dracoLoader: new THREE.DRACOLoader(),

            skyBox: null,
            dotyAnimationMixer: null,
            airshipAnimationMixer: null,
            dotyPositioningPivot: new THREE.Group(),
            airshipPositioningPivot: new THREE.Group(),

            airshipLoadedModel: null,
            dotyLoadedModel: null,
            idleClipAction: null,
            walkingClipAction: null,
            rightWalkingInterval: null,
            leftWalkingInterval: null,
            invertMaskBoolean: null,

            skyDebugMode: false,

            clock: new THREE.Clock(),
        }

        curvedGeo = null;
        curvedMesh = null;
        imageTargetObj = new THREE.Object3D();

        mixer = null;
        glbAnimations = null;

        constructor() { super(); };

        async startLoad({ config, callback }) {
            if (config.cameraConfig.enabled == false) return;
            this.timeoutCheckConfig.startLoadTime = new Date().getTime();
            this.#startLoadSetInterval = setInterval(() => {
                this.timeoutCheckConfig.currentLoadTime = new Date().getTime();
                if (window.XR8 && window.XRExtras) {
                    clearInterval(this.#startLoadSetInterval);
                    Object.assign(this, XR8)
                    window.mui.closePopups();
                    const IS_IOS = /^(iPad|iPhone|iPod)/.test(window.navigator.platform) || (/^Mac/.test(window.navigator.platform) && window.navigator.maxTouchPoints > 1)
                    if (IS_IOS) { window.createImageBitmap = undefined }
                    window.XRExtras ? XRExtras.Loading.showLoading({ onxrloaded: this.onxrloaded(config, callback) }) : window.addEventListener('xrextrasloaded', XRExtras.Loading.showLoading({ onxrloaded: this.onxrloaded(config, callback) }));
                }
                this.timeoutCheck(this.timeoutCheckConfig.secondaryWaitingStartTime, callback);
            }, 15);
        };

        immersalPipelineModule() {
            return {
                name: this.#pipelineModuleName,
                onProcessCpu: ({ frameStartResult, processGpuResult }) => {
                    const { camerapixelarray } = processGpuResult
                    if (!camerapixelarray || !camerapixelarray.pixels) {
                        return
                    }
                    const { rows, cols, rowBytes, pixels } = camerapixelarray
                    return { rows, cols, rowBytes, pixels }
                },
                onStart: ({ canvas }) => {
                    console.log("immersalPipelineModule onStart------------------------------------");
                },
                onUpdate: ({ frameStartResult, processGpuResult, processCpuResult }) => {
                    if (!processCpuResult.reality) {
                        return
                    }
                    const { rotation, position, intrinsics } = processCpuResult.reality
                    const { textureWidth, textureHeight } = frameStartResult
                    const { rows, cols, rowBytes, pixels } = processCpuResult.immersal

                    const fy = 0.5 * intrinsics[5] * textureWidth
                    const cx = 0.5 * (intrinsics[8] + 1.0) * textureWidth
                    const cy = 0.5 * (intrinsics[9] + 1.0) * textureHeight

                    const intr = { fx: fy, fy: fy, ox: cx, oy: cy };
                    this._baseConfig.cameraConfig.onUpdate({ cameraPosition: position, cameraRotation: rotation });
                    this.videoWidth = cols;
                    this.videoHeight = rows;
                    this.pixelBuffer = pixels;
                    this.cameraIntrinsics = intr;
                    this.cameraPosition = position;
                    this.cameraRotation = rotation;
                }
            }
        }

        initSkyScene({ scene, renderer }) {

            this.skyEffectsConfig.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.3.6/');
            this.skyEffectsConfig.dracoLoader.preload();
            this.skyEffectsConfig.loader.setDRACOLoader(this.skyEffectsConfig.dracoLoader);

            renderer.outputEncoding = THREE.sRGBEncoding;
            // Add soft white light to the scene.
            scene.add(new THREE.AmbientLight(0x404040, 7));

            // Add sky dome.
            const skyGeo = new THREE.SphereGeometry(1000, 25, 25);
            const textureLoader = new THREE.TextureLoader();
            const texture = textureLoader.load(this.skyEffectsConfig.TEXTURE);
            texture.encoding = THREE.sRGBEncoding;
            texture.mapping = THREE.EquirectangularReflectionMapping;
            const skyMaterial = new THREE.MeshPhongMaterial({
                map: texture,
                toneMapped: true,
            });

            this.skyEffectsConfig.skyBox = new THREE.Mesh(skyGeo, skyMaterial);
            this.skyEffectsConfig.skyBox.material.side = THREE.BackSide;
            scene.add(this.skyEffectsConfig.skyBox);
            this.skyEffectsConfig.skyBox.visible = false;

            // Load Airship
            this.skyEffectsConfig.loader.load(
                // Resource URL
                this.skyEffectsConfig.AIRSHIP_MODEL,
                // Called when the resource is loaded
                (gltf) => {
                    this.skyEffectsConfig.airshipLoadedModel = gltf.scene
                    // Animate the model
                    this.skyEffectsConfig.airshipAnimationMixer = new THREE.AnimationMixer(this.skyEffectsConfig.airshipLoadedModel)
                    const idleClip = gltf.animations[0]
                    this.skyEffectsConfig.idleClipAction = this.skyEffectsConfig.airshipAnimationMixer.clipAction(idleClip.optimize())
                    this.skyEffectsConfig.idleClipAction.play()

                    // Add the model to a pivot to help position it within the circular sky dome
                    this.skyEffectsConfig.airshipPositioningPivot.add(this.skyEffectsConfig.airshipLoadedModel)
                    scene.add(this.skyEffectsConfig.airshipPositioningPivot)

                    const horizontalDegrees = -25  // Higher number moves model right (in degrees)f
                    const verticalDegrees = 30  // Higher number moves model up (in degrees)
                    const modelDepth = 35  // Higher number is further depth.

                    this.skyEffectsConfig.airshipLoadedModel.position.set(0, 0, -modelDepth)
                    this.skyEffectsConfig.airshipLoadedModel.rotation.set(0, 0, 0)
                    this.skyEffectsConfig.airshipLoadedModel.scale.set(5, 5, 5)
                    this.skyEffectsConfig.airshipLoadedModel.castShadow = true

                    // Converts degrees into radians and adds a negative to horizontalDegrees to rotate in the direction we want
                    this.skyEffectsConfig.airshipPositioningPivot.rotation.y = -horizontalDegrees * (Math.PI / 180)
                    this.skyEffectsConfig.airshipPositioningPivot.rotation.x = verticalDegrees * (Math.PI / 180)
                }
            )

            // Load Doty
            this.skyEffectsConfig.loader.load(
                // Resource URL
                this.skyEffectsConfig.DOTY_MODEL,
                // Called when the resource is loaded
                (gltf) => {
                    this.skyEffectsConfig.dotyLoadedModel = gltf.scene
                    // Animate the model
                    this.skyEffectsConfig.dotyAnimationMixer = new THREE.AnimationMixer(this.skyEffectsConfig.dotyLoadedModel)
                    const idleClip = gltf.animations[0]
                    const walkingClip = gltf.animations[1]
                    this.skyEffectsConfig.idleClipAction = this.skyEffectsConfig.dotyAnimationMixer.clipAction(idleClip.optimize())
                    // this.skyEffectsConfig.walkingClipAction = this.skyEffectsConfig.dotyAnimationMixer.clipAction(walkingClip.optimize())
                    this.skyEffectsConfig.idleClipAction.play()

                    // Add the model to a pivot to help position it within the circular sky dome
                    this.skyEffectsConfig.dotyPositioningPivot.add(this.skyEffectsConfig.dotyLoadedModel)
                    this.skyEffectsConfig.dotyPositioningPivot.rotation.set(0, 0, 0)
                    this.skyEffectsConfig.dotyPositioningPivot.position.set(0, 0, 0)
                    scene.add(this.skyEffectsConfig.dotyPositioningPivot)

                    const horizontalDegrees = 0  // Higher number moves model right (in degrees)
                    const verticalDegrees = 0  // Higher number moves model up (in degrees)
                    const modelDepth = 25  // Higher number is further depth.

                    this.skyEffectsConfig.dotyLoadedModel.position.set(0, 0, -modelDepth)
                    this.skyEffectsConfig.dotyLoadedModel.rotation.set(0, 0, 0)
                    this.skyEffectsConfig.dotyLoadedModel.scale.set(100, 100, 100)
                    this.skyEffectsConfig.dotyLoadedModel.castShadow = true

                    // Converts degrees into radians and adds a negative to horizontalDegrees to rotate in the direction we want
                    this.skyEffectsConfig.dotyPositioningPivot.rotation.y = -horizontalDegrees * (Math.PI / 180)
                    this.skyEffectsConfig.dotyPositioningPivot.rotation.x = verticalDegrees * (Math.PI / 180)

                    // Need to apply the pivot's rotation to the model's position and reset the pivot's rotation
                    // So that you can use the rotation to move Doty in a straight and not a tilted walking path
                    const modelPos = new THREE.Vector3(0, 0, -modelDepth).applyEuler(this.skyEffectsConfig.dotyPositioningPivot.rotation)
                    this.skyEffectsConfig.dotyLoadedModel.position.copy(modelPos)
                    this.skyEffectsConfig.dotyPositioningPivot.rotation.set(0, 0, 0)
                }
            )

        }

        skyEffectsPipelineModule() {
            return {
                name: 'skyEffectsModule',
                onStart: ({ canvas }) => {
                    const { layerScenes, camera, renderer } = XR8.Threejs.xrScene()
                    this.initSkyScene({ scene: layerScenes.sky.scene, camera, renderer });

                    camera.position.set(0, 0, 0)

                    XR8.LayersController.configure({
                        coordinates: {
                            origin: {
                                position: camera.position,
                                rotation: camera.quaternion,
                            },
                        },
                    })

                    canvas.addEventListener('touchmove', (event) => event.preventDefault());
                    document.ondblclick = (event) => event.preventDefault();
                },
                onUpdate: () => {
                    const delta = this.skyEffectsConfig.clock.getDelta()

                    // Animate the models.
                    if (this.skyEffectsConfig.dotyAnimationMixer && this.skyEffectsConfig.airshipAnimationMixer) {
                        this.skyEffectsConfig.dotyAnimationMixer.update(delta)
                        this.skyEffectsConfig.airshipAnimationMixer.update(delta)
                    }
                },
                listeners: [
                    { event: 'layerscontroller.layerfound', process: this.layerFound },
                    { event: 'sky-coaching-overlay.show', process: this.skyCoachingOverlayShow },
                    { event: 'sky-coaching-overlay.hide', process: this.skyCoachingOverlayHide },
                ],
            }
        }

        // generates a mesh that matches an image target's curvature properties
        createCurvedGeometry = (geometry, isFull, userHeight, userWidth) => {
            const length = geometry.arcLengthRadians * (userWidth || 1)
            // return new THREE.CylinderGeometry(
            //     geometry.radiusTop,
            //     geometry.radiusBottom,
            //     userHeight ? geometry.height * userHeight : geometry.height,
            //     50,
            //     1,
            //     true,
            //     (isFull ? 0.0 : (2 * Math.PI - length) / 2) + Math.PI,
            //     isFull ? 2 * Math.PI : length
            // )

            return new THREE.PlaneGeometry((2234 / 1385) * 1, 1);
        }

        imageTargetPipelineModule(initialize, callBack) {
            return {
                name: "imageTargetModule",
                onStart: ({ canvas }) => {
                    const { scene, camera, renderer } = XR8.Threejs.xrScene();
                    initialize(scene, camera, renderer)

                    canvas.addEventListener('touchmove', (event) => {
                        event.preventDefault()
                    })

                    XR8.XrController.updateCameraProjectionMatrix({
                        origin: camera.position,
                        facing: camera.quaternion,
                    })

                    canvas.addEventListener('touchstart', (e) => {
                        // e.touches.length === 1 && XR8.XrController.recenter()
                    }, true);
                },

                // Listeners are called right after the processing stage that fired them. This guarantees that
                // updates can be applied at an appropriate synchronized point in the rendering cycle.
                listeners: [
                    // { event: 'reality.imagescanning', process: this.constructGeometry },
                    // { event: 'reality.imagefound', process: this.showTarget },
                    // { event: 'reality.imageupdated', process: this.showTarget },
                    // { event: 'reality.imagelost', process: this.hideTarget },
                    { event: 'reality.imagescanning', process: (args) => callBack({ event: "imagescanning", response: args.detail, }) },
                    { event: 'reality.imagefound', process: (args) => callBack({ event: "imagefound", response: args.detail, }) },
                    { event: 'reality.imageupdated', process: (args) => callBack({ event: "imageupdated", response: args.detail, }) },
                    { event: 'reality.imagelost', process: (args) => callBack({ event: "imagelost", response: args.detail }) },
                ],
            }
        }

        planeRecognitionPipelineModule(initialize, callBack) {
            return {
                name: "planeRecognitionModule",
                onStart: ({ canvas, GLctx }) => {
                    const { scene, camera, renderer } = XR8.Threejs.xrScene();
                    initialize(scene, camera, renderer);

                    canvas.addEventListener("touchmove", (event) => {
                        event.preventDefault()
                    });

                    canvas.addEventListener("touchstart", (e) => callBack({ event: "touchstart", response: e, }), true);

                    XR8.XrController.updateCameraProjectionMatrix({
                        origin: camera.position,
                        facing: camera.quaternion,
                    })
                },
                onUpdate: ({ frameStartResult, processGpuResult, processCpuResult }) => {
                    if (!processCpuResult.reality) {
                        return
                    }
                    // const { rotation, position, intrinsics } = processCpuResult.reality
                    // const { textureWidth, textureHeight } = frameStartResult
                    const surfaces = processCpuResult.reality;
                    callBack({ event: "surfaces", response: surfaces, })
                    // renderer.render(scene, camera);

                }
            }
        }

        constructGeometry = ({ detail }) => {
            const { scene, camera, renderer } = XR8.Threejs.xrScene();
            // // create the video element
            // this.video = document.createElement('video')
            this.video.src = "./companyInfo.mp4"
            this.video.setAttribute('preload', 'auto')
            this.video.setAttribute('loop', '')
            this.video.setAttribute('muted', '')
            this.video.setAttribute('playsinline', '')
            this.video.setAttribute('webkit-playsinline', '')
            this.video.load()

            const texture = new THREE.VideoTexture(this.video)
            texture.minFilter = THREE.LinearFilter
            texture.magFilter = THREE.LinearFilter
            texture.format = THREE.RGBFormat
            texture.crossOrigin = 'anonymous'

            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();
            document.addEventListener('click', (event) => {
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);

                const companyInfoBtn = raycaster.intersectObject(companyInfoBtnMesh);

                if (companyInfoBtn.length > 0) {
                    console.log("clickclickclickclickclickclickclickclick");
                    this.video.src = "./companyInfo.mp4";
                    this.video.play();
                }

                const companyHistoryBtn = raycaster.intersectObject(companyHistoryBtnMesh);

                if (companyHistoryBtn.length > 0) {
                    console.log("clickclickclickclickclickclickclickclick");
                    this.video.src = "./companyHistory.mp4";
                    this.video.play();
                }

                const departmentBtn = raycaster.intersectObject(departmentBtnMesh);

                if (departmentBtn.length > 0) {
                    console.log("clickclickclickclickclickclickclickclick");
                    this.video.src = "./department.mp4";
                    this.video.play();
                }
            });

            // companyInfoBtn
            const companyInfoBtnGeometry = new THREE.BoxGeometry(2, 1, 0.5);
            const companyInfoBtnMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const companyInfoBtnMesh = new THREE.Mesh(companyInfoBtnGeometry, companyInfoBtnMaterial);
            companyInfoBtnMesh.position.set(-3, -2, -5);
            this.imageTargetObj.add(companyInfoBtnMesh);

            // // companyHistoryBtn
            const companyHistoryBtnGeometry = new THREE.BoxGeometry(2, 1, 0.5);
            const companyHistoryBtnMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const companyHistoryBtnMesh = new THREE.Mesh(companyHistoryBtnGeometry, companyHistoryBtnMaterial);
            companyHistoryBtnMesh.position.set(0, -2, -5);
            this.imageTargetObj.add(companyHistoryBtnMesh);

            // // departmentBtn
            const departmentBtnGeometry = new THREE.BoxGeometry(2, 1, 0.5);
            const departmentBtnMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const departmentBtnMesh = new THREE.Mesh(departmentBtnGeometry, departmentBtnMaterial);
            departmentBtnMesh.position.set(3, -2, -5);
            this.imageTargetObj.add(departmentBtnMesh);


            this.curvedGeo = this.createCurvedGeometry(detail.imageTargets[0].geometry, false);
            this.curvedMesh = new THREE.Mesh(
                this.curvedGeo,
                new THREE.MeshBasicMaterial({ map: texture })
            )
            this.imageTargetObj.visible = false
            this.imageTargetObj.add(this.curvedMesh);
            console.log("this.imageTargetObj", this.imageTargetObj);
            // this.imageTargetObj.children[0].visible = false;
            // this.imageTargetObj.visible = false;
            // const loader = new THREE.GLTFLoader();
            // loader.load(`https://metaverse-ar-beta.oss-cn-hangzhou.aliyuncs.com/WeChat/WeChatData/020240407/sceneModel.glb`, (gltf) => {
            // loader.load(`https://metaverse-ar-beta.oss-cn-hangzhou.aliyuncs.com/WeChat/PluginRepositories/8thwall/Dev/jiu5(1).glb`, (gltf) => {
            //     // this.imageTargetObj.add(gltf.scene);
            //     // gltf.scene.scale.set(10, 10, 10);
            //     // this.glbAnimations = gltf.animations;
            //     // let action = null;
            //     // if (this.glbAnimations && this.glbAnimations.length > 0) {
            //     //     this.mixer = new THREE.AnimationMixer(gltf.scene);
            //     //     for (let i = 0; i < this.glbAnimations.length; i++) {
            //     //         this.mixer.clipAction(this.glbAnimations[i]).play();
            //     //     }
            //     // }
            //     // // action.loop = THREE.LoopOnce;

            //     setTimeout(() => {
            //         this.imageTargetObj.children[0].visible = true;
            //         // this.imageTargetObj.children[1].visible = false;
            //     }, 8000);

            //     const animate = () => {
            //         requestAnimationFrame(animate)
            //         // 场景动画
            //         if (this.mixer) {
            //             this.mixer.update(0.01);
            //         }

            //         renderer.render(scene, camera);
            //     }
            //     // animate();
            // }, (xhr) => {
            // }, (err) => {

            // })
            const loader = new THREE.FBXLoader();
            loader.load("https://metaverse-jwar-release.oss-cn-shanghai.aliyuncs.com/WeChat/PluginRepositories/8thwall/Dev/jiu5.fbx", function (obj) {
                console.log("FBXLoaderFBXLoaderFBXLoaderFBXLoaderFBXLoader", obj);
                // this.imageTargetObj.add(obj);
                obj.scale.set(0.05, 0.05, 0.05);
                scene.add(obj);
                scene.position.set(0, 0.5, -15);
                console.log("obj.animations[0]obj.animations[0]obj.animations[0]", obj.animations[0]);

                if (obj.animations && obj.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(obj);
                    console.log("1");
                    // const material = new THREE.MeshBasicMaterial()
                    // material.side = THREE.DoubleSide
                    // const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material)
                    // cube.position.set(0, 0.5, -3)
                    // cube.castShadow = true
                    // scene.add(cube)
                    // 查看动画数据
                    // obj.animations[0]：获得剪辑对象clip

                    let AnimationAction = this.mixer.clipAction(obj.animations[0]);
                    console.log("2");
                    // AnimationAction.timeScale = 1; //默认1，可以调节播放速度
                    // AnimationAction.loop = THREE.LoopOnce; //不循环播放
                    // AnimationAction.clampWhenFinished = true;//暂停在最后一帧播放的状态
                    AnimationAction.play();
                    console.log("3");
                    this.animate();
                    console.log("4");
                } else {
                    console.log("5");
                }
            })
        }

        animate = () => {
            const { scene, camera, renderer } = XR8.Threejs.xrScene();
            console.log("scene, camera, renderer ", scene, camera, renderer);
            requestAnimationFrame(this.animate);
            // 场景动画
            if (this.mixer) {
                this.mixer.update(0.01);
            }
            renderer.render(scene, camera);
        }

        showTarget = ({ detail }) => {
            if (detail.name === 'jimuquan') {
                // console.log("this.imageTargetObj", this.imageTargetObj);
                this.imageTargetObj.position.copy(detail.position)
                this.imageTargetObj.quaternion.copy(detail.rotation)
                this.imageTargetObj.scale.set(detail.scale, detail.scale, detail.scale)
                this.imageTargetObj.visible = true;
            }
        }

        // Hides the image frame when the target is no longer detected.
        hideTarget = ({ detail }) => {
            // console.log("hideTargethideTargethideTarget", detail);
            if (detail.name === 'jimuquan') {
                this.imageTargetObj.visible = false
            }
        }

        layerFound({ detail }) {
            if (detail?.name === 'sky') {
                XR8.LayersController.recenter()
            }
        }

        skyCoachingOverlayShow(e) {
            console.log('EXAMPLE: SKY COACHING OVERLAY - SHOW', e)
        }

        skyCoachingOverlayHide(e) {
            console.log('EXAMPLE: SKY COACHING OVERLAY - HIDE', e)
        }

        async onxrloaded(config, callback) {
            const { xrControllerConfigure = { disableWorldTracking: false, scale: "absolute" } } = config;
            let that = this;
            this.getTokenAndmapId();
            XR8.XrController.configure(xrControllerConfigure);
            // const incompatibilityReasons = XR8.XrDevice.IncompatibilityReasons;
            // if (incompatibilityReasons.INSUFFICIENT_PERMISSION) {
            //     console.log("需要授予相机和传感器权限以启用 AR/VR 功能。");
            // } else if (incompatibilityReasons.DEVICE_NOT_SUPPORTED) {
            //     console.log("您的设备不支持 AR/VR 功能。");
            // } else if (incompatibilityReasons.BROWSER_NOT_SUPPORTED) {
            //     console.log("您的浏览器不支持 AR/VR 功能。请尝试使用支持的浏览器。");
            // } else {
            //     console.log("发生未知错误或不明确的不兼容性原因。");
            // }


            XR8.addCameraPipelineModules([  // Add camera pipeline modules.
                // Existing pipeline modules.
                XR8.GlTextureRenderer.pipelineModule(),    // Draws the camera feed. ***
                XR8.CameraPixelArray.pipelineModule({ luminance: true }),
                XR8.XrController.pipelineModule(),           // Enables SLAM tracking.
                XR8.Threejs.pipelineModule(),                // Creates a ThreeJS AR Scene.

                XR8.CanvasScreenshot.pipelineModule(),       // Canvas screenshot

                XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
                XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
                XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup. 
                XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
                // Custom pipeline modules.
                // this.immersalPipelineModule(),                    // Enables Immersal VPS support.
                // placegroundScenePipelineModule(),
                {
                    name: 'camerastartupmodule',
                    onBeforeRun: ({ config }) => {
                        console.log("onBeforeRun", config);
                    },
                    onStart: ({ canvasWidth, canvasHeight }) => {
                        console.log("onStart", canvasWidth, canvasHeight);
                    },
                    onAttach: ({ framework, canvas, GLctx, computeCtx, isWebgl2, orientation, videoWidth, videoHeight, canvasWidth, canvasHeight, status, stream, video, version, imageTargets, config }) => {
                        console.log("onAttach");
                        if (that.isRun) {
                            if (this.isSkyEffects == false) {
                                ImmersalPipeline.setDisableWorldTacking !== null ? ImmersalPipeline.setDisableWorldTracking({ success: true }) : null;
                            }
                        } else {
                            XR8.initialize().then(() => {
                                that.isRun = true;
                                this._baseConfig.debugger == true ? new window.VConsole() : null;
                                return callback({ success: true });
                            });
                        }
                    },
                    onDetach: ({ framework }) => {
                        console.log("onDetach", framework);
                    },
                    onUpdate: ({ framework, frameStartResult, processGpuResult, processCpuResult }) => {
                        // console.log("onUpdate", frameStartResult);
                    },
                    onPaused: () => { ImmersalPipeline.xr8PauseOrResumeCb !== null ? ImmersalPipeline.xr8PauseOrResumeCb({ success: true, message: "pausing application" }) : null; },
                    onResume: () => { ImmersalPipeline.xr8PauseOrResumeCb !== null ? ImmersalPipeline.xr8PauseOrResumeCb({ success: true, message: "resuming application" }) : null; },
                    onCameraStatusChange: ({ status, stream, video }) => {
                        if (status == 'requesting') {
                            // 在 中'requesting'，浏览器正在打开摄像头，并在适用的情况下检查用户权限。在这种状态下，适合向用户显示接受相机权限的提示。
                            console.log("正在打开摄像头");
                            if (navigator.userAgent.indexOf("Android") > -1 || navigator.userAgent.indexOf("Linux") > -1 || navigator.userAgent.indexOf("Windows Phone") > -1) {
                                that.#isImpowerSetTimeout = setTimeout(() => {
                                    XR8.run({ canvas: document.getElementById(that._baseConfig.cameraConfig.canvas) });
                                }, 3000);
                            }
                        } else if (status == 'hasStream') {
                            // 授予用户权限并成功打开相机后，状态将切换为 ，'hasStream'并且可以忽略有关权限的任何用户提示。
                            console.log("授予用户权限并成功打开相机");
                            clearTimeout(this.#isImpowerSetTimeout);
                        } else if (status == 'hasVideo') {
                            // 一旦相机帧数据开始可供处理，状态就会切换到'hasVideo'，并且相机源可以开始显示。
                            console.log("相机帧数据开始可供处理");
                            clearTimeout(this.#isImpowerSetTimeout);
                        } else if (status == 'failed') {
                            // 如果相机源无法打开，则状态为'failed'。在这种情况下，用户可能拒绝了权限，因此建议帮助他们重新启用权限。
                            console.log("用户拒绝了权限");
                            clearTimeout(this.#isImpowerSetTimeout);
                            document.getElementById(this._baseConfig.cameraConfig.canvas).style.zIndex = 801;
                            document.getElementById(this._baseConfig.unityConfig.canvas).style.zIndex = 0;
                            XR8.initialize().then(() => {
                                this._baseConfig.debugger == true ? new window.VConsole() : null;
                                return callback({ success: false, errors: "User Deny Camera Authorization" });
                            });
                        }
                    },
                    onDeviceOrientationChange: ({ GLctx, computeCtx, videoWidth, videoHeight, orientation }) => {
                        // ImmersalPipeline.getDeviceOrientationChange({ success: true, deviceOrientation: { GLctx, computeCtx, videoWidth, videoHeight, orientation } })
                        console.log("onDeviceOrientationChange", GLctx, computeCtx, videoWidth, videoHeight, orientation);
                    },
                    onException: (error) => {
                        that.isRun = false;
                        that.setRunTiemErrorContainerCss();
                        console.error('XR threw an exception', error);
                    },
                    // requiredpermissions: () => ([XR8.XrPermissions.permissions().DEVICE_GPS, XR8.XrPermissions.permissions().DEVICE_ORIENTATION]),
                }
            ]);

            XR8.CanvasScreenshot.setForegroundCanvas(document.getElementById(this._baseConfig.cameraConfig.canvas));
            XR8.CanvasScreenshot.configure({ maxDimension: 1920, jpgCompression: 100 });
            XR8.run({ canvas: document.getElementById(this._baseConfig.cameraConfig.canvas) });
            // Open the camera and start running the camera run loop.
            this.customizingTheLoadScreen();
            // new window.VConsole()    
        }

        injectImmersalPipelineModule(callBack) { XR8.addCameraPipelineModules([this.immersalPipelineModule()]); return callBack(); }

        removeImmersalPipelineModules(callBack) { XR8.removeCameraPipelineModules([this.#pipelineModuleName]); return callBack(); }

        injectSkyEffectsPipelineModule(callBack, configure) {
            XR8.stop();
            XR8.addCameraPipelineModules([this.skyEffectsPipelineModule(), XR8.LayersController.pipelineModule(), SkyCoachingOverlay.pipelineModule(),]);
            this.setSkyEffects(configure, (state) => callBack(state));
        }

        removeSkyEffectsPipelineModule(callBack) { [XR8.stop(), XR8.removeCameraPipelineModules(["skyEffectsModule", XR8.LayersController.pipelineModule(), SkyCoachingOverlay.pipelineModule()]), XR8.run({ canvas: document.getElementById(this._baseConfig.cameraConfig.canvas) }), this.setLoadingContainerCss()]; return callBack({ success: true, message: "Disable Sky Segmentation" }); }

        xr8PauseOrResume(isCameraStart, callBack) {
            ImmersalPipeline.xr8PauseOrResumeCb = callBack;
            isCameraStart == true ? XR8.pause() : [XRExtras.Loading.showLoading({ onxrloaded: XR8.resume() }), this.setLoadingContainerCss()];
        }

        async setDisableWorldTracking(isEnabled, callback) {
            await this.setXrController({ disableWorldTracking: isEnabled, scale: isEnabled == true ? "responsive" : "absolute" }).finally(_ => ImmersalPipeline.setDisableWorldTracking = callback).catch(_ => callback({ success: false }));
        }

        async setXrController(config = { disableWorldTracking: false, scale: "absolute" }) {
            XR8.stop();
            this.isSkyEffects = false;
            XR8.XrController.configure(config);
            XR8.run({ canvas: document.getElementById(this._baseConfig.cameraConfig.canvas) });
            this.setLoadingContainerCss();
        }

        setSkyEffects(configure = { animationColor: '#E86FFF', promptText: '请对准天空开始识别~', }, callback) {
            this.isSkyEffects = true;
            // Configured here
            SkyCoachingOverlay.configure(configure);
            XR8.LayersController.configure({ layers: { sky: { invertLayerMask: false } } });
            XR8.Threejs.configure({ layerScenes: ['sky'] });
            XR8.run({ canvas: document.getElementById(this._baseConfig.cameraConfig.canvas), verbose: true, });
            this.customizingTheLoadScreen();
            return callback({ success: true, message: "Enables Sky Segmentation" });
            // XR8.LayersController.pipelineModule();      // Enables Sky Segmentation.
            // SkyCoachingOverlay.pipelineModule();        // Enables Sky Segmentation.
        }

        setImageTargetRecognition(initialize = () => { }, callBack, isClearPipeline = false) {
            this.isSkyEffects = true;
            XR8.addCameraPipelineModules([this.imageTargetPipelineModule(initialize, (args) => { callBack(args) })]);
            XR8.stop();
            XR8.run({ canvas: document.getElementById(this._baseConfig.cameraConfig.canvas) });
            this.setLoadingContainerCss();
        }

        setPlaneRecognition(initialize = () => { }, callBack, isClearPipeline = false) {
            this.isSkyEffects = true;
            XR8.addCameraPipelineModules([this.planeRecognitionPipelineModule(initialize, (args) => { callBack(args) })]);
            XR8.stop();
            XR8.run({ canvas: document.getElementById(this._baseConfig.cameraConfig.canvas) });
            this.setLoadingContainerCss();
        }

        setLoadingContainerCss() {
            document.getElementById("loadingContainer").innerHTML = `<div id="loadingContainer" class="absolute-fill"><div id="loadImageContainer" class="absolute-fill"><img src="//cdn.8thwall.com/web/img/loading/v2/load-grad.png" id="loadImage" class="spin"/></div></div> `
            document.getElementById("loadImage").setAttribute("src", `${this._baseOSSUrl}/PluginRepositories/Public/Image/donutQuarter.png`)
        }

        setRunTiemErrorContainerCss() {
            document.getElementById("runtimeErrorContainer").innerHTML = `<div id="error_msg_unknown" class=""> <div class="error-text-outer-container"> <div class="error-text-container error-margin-top-5"> <p><img height="75px" src="//cdn.8thwall.com/web/img/runtimeerror/v1/computer-voxel.png" class="floater"></p> <div class="error-text-header">哇呜，出了点儿问题!</div> <div class="error-text-hint"> <p id="error_unknown_detail"> <span class="wk-app-name"></span>
                <img class="foreground-image" src="//cdn.8thwall.com/web/img/loading/v2/reload.svg" onclick="XR8.run({ canvas: document.getElementById('${this._baseConfig.cameraConfig.canvas}') })">点击重新发起获取权限</p></div> </div> </div> </div>`
            // document.getElementById("floater").setAttribute("src", `${this._baseOSSUrl}/PluginRepositories/Public/Image/donutQuarter.png`)
            document.getElementById("runtimeErrorContainer").style.zIndex = 900;
        }

        clearCameraPipelineModules() { XR8.clearCameraPipelineModules(); };

        async _checkCameraPermission() {
            try {
                const permissionStatus = await navigator.permissions.query({ name: 'camera' });
                console.log("permissionStatuspermissionStatus", permissionStatus);
                if (navigator.permissions.query({ name: 'camera' }).state === 'granted') {
                    console.log('User granted camera access');
                    clearInterval(this.#isImpowerSetInterval);
                    XR8.run({ canvas: document.getElementById(this._baseConfig.cameraConfig.canvas) });
                } else {
                    console.log('User has not granted camera access yet');
                    clearInterval(this.#isImpowerSetInterval);
                }
            } catch (error) {
                // clearInterval(this.#isImpowerSetInterval);
                // console.error('Error checking camera permission:', error);
                // this._errorsAlert(`Error checking camera permission:`, "提示", error);
            }
        }

        customizingTheLoadScreen() {
            // No permission prompt android
            // document.querySelector('.permissionIconIos').innerHTML='<img class="foreground-image" src="//cdn.8thwall.com/web/img/loading/v2/camera.svg">';
            document.getElementById("cameraPermissionsErrorAppleMessage").innerHTML = '<p>相机权限被拒绝授权</p><p>请同意启用相机访问权限</p>';
            document.querySelector('.bottom-message').innerHTML = `<span class="wk-app-name"></span>
                <img class="foreground-image" src="//cdn.8thwall.com/web/img/loading/v2/reload.svg" onclick="XR8.run({ canvas: document.getElementById('${this._baseConfig.cameraConfig.canvas}') })">点击重新发起获取权限`;

            // No permission prompt apple
            document.getElementById("cameraPermissionsErrorAndroid").innerHTML = `
                <div class="permissionIcon">
                    <img class="foreground-image" src="//cdn.8thwall.com/web/img/loading/v2/camera.svg"> 
                </div> 
                <div class="loading-error-header">让我们打开你的相机权限</div> 
                    <ol class="loading-error-instructions"> 
                    <li>请寻找 <img class="foreground-image" src="//cdn.8thwall.com/web/img/loading/v2/dots.svg"> 在右上方 </li> 
                    <li>利用设置打开</li> <li class="chrome-instruction hidden"> <span class="highlight">网站的设置</span> </li> 
                    <li class="chrome-instruction hidden"> 
                        <span class="highlight">相机</span> 
                    </li> 
                    <li class="chrome-instruction hidden"> 
                        <span class="highlight">被阻止了</span> 
                        <br> 
                        <span class="camera-instruction-block domain-view">apps.8thwall.com</span>
                    </li> 
                    <li class="chrome-instruction hidden">
                        <span class="camera-instruction-button">请去获取权限</span> 
                    </li> 
                    <li class="samsung-instruction hidden"> 
                        <span class="highlight">Advanced</span> 
                    </li> 
                    <li class="samsung-instruction hidden"> 
                        <span class="highlight">Manage website data</span> 
                    </li>
                    <li class="samsung-instruction hidden"> Press and hold<br> 
                        <span class="camera-instruction-block domain-view">apps.8thwall.com</span> 
                    </li> 
                    <li class="samsung-instruction hidden"> 
                        <span class="highlight" style="color:#1500ba">DELETE</span>
                    </li> 
                    </ol> 
                    <div class="loading-error-footer"> 
                    <a href="#">貌似出现了一些问题</a>
                    </div>
                </div>`
            // <img class="foreground-image" style="transform:rotate(130deg)" src="//cdn.8thwall.com/web/img/loading/v2/reload.svg" onclick="window.location.reload()">

            // TurnDown Page
            document.getElementById('userPromptError').innerHTML = '<h1>相机权限被拒绝授权</h1><p>您需要同意启用相机权限与运动传感器权限才能继续访问。</p><button id="reloadButton" class="main-button" onclick="XR8.run({ canvas: document.getElementById("xr8Canvas") })">去授权</button>';

            // Loading Screen
            // const cameraImageBg = document.getElementById("requestingCameraPermissions").src = "./Images/startupPage.jpg";
            const cameraImageBg = document.getElementById("requestingCameraPermissions").innerHTML = '<img id="requestingCameraIcon" style="margin-top: 8.75rem;" src="//cdn.8thwall.com/web/img/loading/v2/camera.svg">'
            // const cameraImage = document.getElementById("requestingCameraIcon").src = "./Images/startupPage.jpg";
            // const loadImageBg = document.getElementById("loadBackground").src = "./Images/background.png";
            // const loadImage = document.getElementById("loadImage").src = "./Images/button.gif";

            // Motion Sensor Prompt
            const observer = new MutationObserver(() => {
                if (document.querySelector('.prompt-box-8w')) {
                    if (!this.inDom) {
                        // document.querySelector('.prompt-box-8w').style.backgroundImage ='url("./Images/popupBackground.svg")';
                        document.querySelector('.prompt-box-8w p').innerHTML = '<p class="vrPopTitle">提示<p/><p class="vrPopContent"><strong>应用程序需要您相机权限与运动传感器权限</strong><br/><br/>才能进行扫描扫描AR内容</strong></p>'
                        document.querySelector('.prompt-button-8w').innerHTML = '拒绝'
                        document.querySelector('.button-primary-8w').innerHTML = '同意'
                    }
                    this.inDom = true
                } else if (this.inDom) {
                    this.inDom = false
                    observer.disconnect()
                }
            })
            observer.observe(document.body, { childList: true });



            // motion sensors 
            document.getElementById('motionPermissionsErrorApple').innerHTML = `
            <h1>运动传感器权限被拒绝授权</h1>
            <p>您已经阻止页面访问您的运动传感器</p> 
            <p>您需要同意启用相机权限与运动传感器权限才能继续访问
                <span class="wk-app-name"></span> 
                需要您重启启动应用程序，重新发起运动传感器获取权限
            </p>
            <button id="reloadButton" class="main-button" onclick="XR8.run({ canvas: document.getElementById('xr8Canvas') })">我已知晓</button>`;

            // copyLinkViewAndroid
            // <img class="foreground-image poweredby-img" src="${this._baseOSSUrl}/PluginRepositories/Public/Image/logo.png">
            document.getElementById("copyLinkViewAndroid").innerHTML = `
            <div class="error-text-outer-container">
                <div class="error-text-container error-margin-top-5">
                <p id="error_text_header_unknown" class="open-header-unknown">
                    <p class="error_text_header_title">很抱歉!由于您拒绝了相机权限无法继续体验!</p>
                    <p class="error_text_header_tips">您可以重新进入并“同意授权”打开相机后进行体验！也可以点击下方按钮下载“游历星河”APP进行体验。</p>
                </p>
                
                <button id="copy_link_android" class="copy-link-btn"><a href="#">我已知晓</a></button>
                </div>
            </div>
            `
            // <img id="app_img" class="app-header-img unknown"> <br> 

            // linkOutViewAndroid
            // <img id="app_img" class="app-header-img unknown"><br></br>
            // <img class="foreground-image poweredby-img" src="//cdn.8thwall.com/web/img/almostthere/v2/poweredby-horiz-white-4.svg"> 
            // document.getElementById("linkOutViewAndroid").innerHTML = `
            // <div id="linkOutViewAndroid" class="absolute-fill hidden"> 
            //     <div class="error-text-outer-container">
            //         <p>出现了亿点小问题，请点击按钮帮我重新运行吧</p>
            //         <div class="error-text-container error-margin-top-5">
            //         <a id="open_browser_android" class="start-ar-button" onclick="window.location.reload()">点我重启运行</a> 
            //         </div>
            //     </div>
            // </div>`;
            // <a id="open_browser_android" class="start-ar-button" onclick="XR8.run({ canvas: document.getElementById('xr8Canvas') })">您的网络开了小差，点击重新进入！</a> 
            document.getElementById("linkOutViewAndroid").innerHTML = `<div class="error-text-outer-container"> 
                <div class="error-text-container error-margin-top-5"> 
                <br>
                
                </div> 
            </div>`;

            document.getElementById("loadBackground").innerHTML = `
            <div id="loadBackground" class="absolute-fill">
                <div id="loadImageContainer" class="absolute-fill">
                <img src="//cdn.8thwall.com/web/img/loading/v2/load-grad.png" id="loadImage" class="spin"/>
                </div>
            </div>
            `

            // loadImage
            document.getElementById("loadImage").setAttribute("src", `${this._baseOSSUrl}/PluginRepositories/Public/Image/donutQuarter.png`)
        }

        static outputVersion(version = "1.0.1", name = "Dev") {
            window._xr8 = { "Channel": "xr8js", "Version": version, "Cenvironment": name, };
            console.log(`%c%c xr8thWall %c Version：${version} %c Cenvironment：${name} `,
                'color: #3eaf7c; font-size: 1rem;line-height:1.875rem;',
                'background: #35495e; padding: .25rem; border-radius: .1875rem 0 0 .1875rem; color: #fff',
                'background: #41b883; padding: .25rem; border-radius: 0 0 0 0; color: #fff',
                'background: #eb9e9e; padding: .25rem; border-radius: 0 .1875rem .1875rem 0; color: #fff',
            );
        }

        canvasScreenshot(callBack) {
            this.playScreenshot(({ xr8Image, xr8Imagedata, screenshotPicture, UHQScreenshotPicture }) => {
                callBack({ xr8Image, xr8Imagedata, screenshotPicture, UHQScreenshotPicture })
            });
        }

        getXr8Screenshot(callBack) {
            XR8.CanvasScreenshot.takeScreenshot().then(data => {
                let xr8Image = new Image();
                xr8Image.src = 'data:image/jpeg;base64,' + data;
                xr8Image.onload = () => callBack({ xr8Image, xr8Imagedata: data });
            }, error => {
                this._errorsAlert("Handle screenshot error。", "警告", { error });
            });
        }

        playScreenshot(callback) {
            window.requestAnimationFrame(() => {
                let xr8Canvas = document.getElementById(this._baseConfig.cameraConfig.canvas);
                let unityCanvas = document.getElementById(this._baseConfig.unityConfig.canvas);
                this.getXr8Screenshot(({ xr8Image, xr8Imagedata }) => {
                    const devicePixelRatio = window.devicePixelRatio || 1;
                    let canvasScreenshot = document.createElement('canvas');
                    let canvasScreenshotCtx = canvasScreenshot.getContext('2d');

                    canvasScreenshot.width = window.innerWidth * devicePixelRatio;
                    canvasScreenshot.height = window.innerHeight * devicePixelRatio;

                    canvasScreenshotCtx.scale(devicePixelRatio, devicePixelRatio);
                    canvasScreenshotCtx.imageSmoothingEnabled = true;

                    canvasScreenshotCtx.drawImage(xr8Image, 0, 0, window.innerWidth, window.innerHeight);
                    requestAnimationFrame(() => {
                        let unityCanvasImage = new Image();
                        unityCanvasImage.src = unityCanvas.toDataURL('image/png');
                        unityCanvasImage.onload = () => {
                            canvasScreenshotCtx.drawImage(unityCanvasImage, 0, 0, window.innerWidth, window.innerHeight);
                            let screenshotPicture = canvasScreenshot.toDataURL('image/jpeg');
                            // canvasScreenshot.toBlob((blob) => {
                            //     const url = URL.createObjectURL(blob);
                            //     callback({ xr8Image, xr8Imagedata, screenshotPicture, UHQScreenshotPicture: screenshotPicture });
                            // }, 'image/jpeg');
                            callback({ xr8Image, xr8Imagedata, screenshotPicture, UHQScreenshotPicture: screenshotPicture });
                        }
                    });
                });
            }, 60);
        }

        setTimeoutCheckConfig() {
            const { _baseConfig: { timeoutConfig = {} } } = this;
            for (const [key, value] of Object.entries(timeoutConfig)) { this.timeoutCheckConfig[key] = value; };
        }

        timeoutCheck(time, callback) {
            if ((this.timeoutCheckConfig.currentLoadTime - this.timeoutCheckConfig.startLoadTime) / 1000 >= (this.timeoutCheckConfig.secondaryWaiting == false ? time : this.timeoutCheckConfig.secondaryWaitingOverTime) && this.timeoutCheckConfig.isEstimate == false) {
                let { first, twice } = this.timeoutCheckConfig;
                this.timeoutCheckConfig.isEstimate = true;
                if (this.timeoutCheckConfig.secondaryWaiting == false) {
                    console.log("请求已经超预设值：https://cdn.8thwall.com/xr-jse-24.0.9.2165.js");
                    window.mui.confirm(first.message, first.title, first.btnValue, ({ index, value }) => {
                        if (index == 1) {
                            console.log("Continue Await ...");
                            this.timeoutCheckConfig.isEstimate = false;
                            this.timeoutCheckConfig.secondaryWaiting = true;
                            this.timeoutCheckConfig.startLoadTime = new Date().getTime();
                        } else {
                            clearInterval(this.#startLoadSetInterval);
                            this._errors({ success: false, message: "XR8 Initialization Failure" });
                            callback({ success: false, errors: "XR8 Initialization Failure" });
                        }
                    }, "div");
                } else if (this.timeoutCheckConfig.secondaryWaiting == true) {
                    clearInterval(this.#startLoadSetInterval);
                    window.mui.alert(twice.message, twice.title, twice.btnValue, ({ index, value }) => {
                        this._errors({ success: false, message: "XR8 Initialization Failure" });
                        callback({ success: false, errors: "XR8 Initialization Failure" });
                    }, 'div');
                }
            }
        }
    }

    exports.Init = class Init extends ImmersalPipeline {
        _labelTypeName = ["scrip", "link"];
        _baseConfig = null;
        static scriptOrCSSTree = [];
        // static _baseOSSUrlPro = "https://metaoss-ar-release.shengydt.com/WeChat";
        static _baseOSSUrlPro = "https://metaverse-jwar-release.oss-cn-shanghai.aliyuncs.com/WeChat";
        static _loadJSOrCSS = [
            {
                src: `${Init._baseOSSUrlPro}/PluginRepositories/Public/three.min.js`,
                type: 1,
            },
            {
                src: `${Init._baseOSSUrlPro}/PluginRepositories/Public/UPNG.js`,
                type: 1,
            },
            {
                src: `${Init._baseOSSUrlPro}/PluginRepositories/Public/pako.min.js`,
                type: 1,
            },
            {
                src: `${Init._baseOSSUrlPro}/PluginRepositories/Public/mui.min.js`,
                type: 1,
            },
            {
                src: `${Init._baseOSSUrlPro}/PluginRepositories/Public/mui.min.css`,
                type: 2,
            },
            {
                src: `${Init._baseOSSUrlPro}/PluginRepositories/Public/jquery-3.4.1.min.js`,
                type: 1,
            },
            {
                src: `${Init._baseOSSUrlPro}/PluginRepositories/Public/vconsole.min.js`,
                type: 1,
            },
            {
                src: `${Init._baseOSSUrlPro}/PluginRepositories/8thwall/8thwall.css`,
                type: 2,
            },
            {
                // XR Extras - provides utilities like load screen, almost there, and error handling.
                //  See github.com/8thwall/web/tree/master/xrextras
                src: `${Init._baseOSSUrlPro}/PluginRepositories/8thwall/xrextras.js`,
                // src: "https://cdn.8thwall.com/web/xrextras/xrextras.js",
                type: 1,
            },
            {
                // Coaching Overlay 
                src: `${Init._baseOSSUrlPro}/PluginRepositories/8thwall/coaching-overlay.js`,
                // src: "https://cdn.8thwall.com/web/coaching-overlay/coaching-overlay.js",
                type: 1,
            },
            // {
            //     src: "https://res.wx.qq.com/open/js/jweixin-1.6.0.js",
            //     type: 1,
            // },
            // {
            //     // 8thWall Web - Replace the app key here with your own app key
            //     src: `https://apps.8thwall.com/xrweb?appKey=`,
            //     type: 1,
            // },
            {
                src: `${Init._baseOSSUrlPro}/PluginRepositories/Public/GLTFLoader.js`,
                type: 1,
            },
            {
                src: `${Init._baseOSSUrlPro}/PluginRepositories/Public/DRACOLoader.js`,
                type: 1,
            },
            {
                src: `${Init._baseOSSUrlPro}/PluginRepositories/Public/FBXLoader.js`,
                type: 1,
            },
            {
                src: `${Init._baseOSSUrlPro}/PluginRepositories/Public/inflate.js`,
                type: 1,
            }
        ];
        _errors = null;
        globalThat = this;
        static Sensors = null;

        constructor(config, callback, errors) {
            super();
            this._baseConfig = config;
            this.setTimeoutCheckConfig();
            this.setInterface();
            this._errors = errors;
            this._isCheckAppKey(config, async ({ success, errors }) => {
                if (success) {
                    await Init.loadNeedJsOrCSS.bind(this)(Init._loadJSOrCSS, () => this._isLoadComplete.bind(this)(({ success, type }) => success == true ? [this.startLoad({ config, callback }), Init.injectSensorsdata(),] : null));
                } else {
                    alert("appKey 不能为空！");
                    callback({ success, errors });
                }
            });

            window.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    console.log("document.hidden");
                } else {
                    console.log("document.show")
                }
                console.log('beforeunload');
            });

            window.addEventListener('pagehide', function () {
                console.log("pagehide");
            });
        }

        static async loadNeedJsOrCSS(handNeedLoadJSOrCSS, callback) {
            await Init.fetchExternalLibrary("1JQhYDLd1E7p8jnKth96BNIyfd0zRIqfMejyXzj0shJjcFMiSIybdWPFDzGq95nagyx2ri", async () => { });
            if (Array.from(new Set(Init._loadJSOrCSS.concat(handNeedLoadJSOrCSS).map(JSON.stringify))).map(JSON.parse) == Init.scriptOrCSSTree.length) { return callback(); }
            for (const { src, type } of Array.from(new Set(Init._loadJSOrCSS.concat(handNeedLoadJSOrCSS).map(JSON.stringify))).map(JSON.parse)) {
                let result = await Init._checkLoadType({ src, type });
                if (result == true) continue;
                if (Array.from(new Set(Init._loadJSOrCSS.concat(handNeedLoadJSOrCSS).map(JSON.stringify))).map(JSON.parse).length == Init.scriptOrCSSTree.length) {
                    return callback();
                }
            }
        }

        static _isAlreadyLoaded({ src: existingSrc, type: existingType }) {
            return Array.from(existingType == 1 ? document.getElementsByTagName('script') : document.querySelectorAll('link[rel="stylesheet"]')).some(scriptOrsheet => scriptOrsheet[existingType == 1 ? "src" : "href"].includes(existingSrc.split('/')[existingSrc.split('/').length - 1]));
        }

        static async _checkLoadType({ src, type }) {
            if (Init._isAlreadyLoaded({ src, type }) == true) { Init.scriptOrCSSTree.push(null); return true; };
            return new Promise(function (resolve, reject) {
                let scriptOrCSStDom = type == 1 ? document.createElement("script") : document.createElement("link");
                scriptOrCSStDom.type = type == 1 ? "text/javascript" : "text/css";
                scriptOrCSStDom[type == 1 ? "src" : "href"] = src.indexOf("xrweb") > 1 ? `${src}` : `${src}?v=${window._xr8.Version}`;
                scriptOrCSStDom[type == 1 ? "" : "rel"] = "stylesheet";
                Init.scriptOrCSSTree.push(scriptOrCSStDom);
                document.head.appendChild(scriptOrCSStDom);
                
                scriptOrCSStDom.onload = resolve;
                scriptOrCSStDom.onerror = reject;
            });
        }

        static async fetchExternalLibrary(key, callBack) {
            try {
                if (window._XR8 || window.XR8) return;
                // let xrwebSetInterval = null;
                // const xrwebResponse = await fetch(`https://apps.8thwall.com/xrweb?appKey=${key}`);
                // const xrwebScriptCode = await xrwebResponse.text();

                const xrwebScriptElement = document.createElement('script');
                xrwebScriptElement.type = 'text/javascript';
                xrwebScriptElement.src = `https://apps.8thwall.com/xrweb?appKey=${key}`;
                xrwebScriptElement.crossOrigin = "anonymous";
                document.head.appendChild(xrwebScriptElement);
                // Init.rewrite8thScript(`https://metaoss-ar-release.shengydt.com/WeChat/PluginRepositories/8thwall/xrJse.js`, () => {
                Init.rewrite8thScript(`https://metaverse-jwar-release.oss-cn-shanghai.aliyuncs.com/WeChat/PluginRepositories/8thwall/xrJse.js`, () => {
                    callBack();
                    // xrwebScriptElement.onload = async () => {
                    //     document.head.appendChild([].find.call(document.scripts, e => /\/([a-zA-Z0-9-]+)\-\d+\.\d+\.\d+\.\d+\.js$/.test(e.src)));
                    //     const newestScriptSrc = xrwebScriptCode.match(/xrwebUrl\s*=\s*["']([^"']+)["']/)[1];
                    //     const newestXrJseVersions = newestScriptSrc.match(/xr-jse-(\d+\.\d+\.\d+\.\d+)\.js/);
                    //     window.xrJse = newestXrJseVersions;
                    //     if (window.xrJse && window.xrJse == newestXrJseVersions) {
                    //         fetch(`https://metaoss-webar.shengydt.com/PluginRepositories/8thwall/xrJse.js`, { method: 'GET', headers: { 'Content-Type': 'application/javascript', }, credentials: 'omit', }).then(response => {
                    //             if (!response.ok) { throw new Error(`Failed to fetch script: ${response.status} ${response.statusText}`); }
                    //             return response.text();
                    //         }).then(scriptCode => {
                    //             console.log('Script loaded successfully');
                    //             xrwebSetInterval = setInterval(() => {
                    //                 if (window._XR8 && !window.XR && !window.XR8) {
                    //                     clearInterval(xrwebSetInterval);
                    //                     console.log("https://metaoss-webar.shengydt.com/PluginRepositories/8thwall/xrJse.js");
                    //                     eval(scriptCode);
                    //                 } else {
                    //                     clearInterval(xrwebSetInterval);
                    //                     console.log("https://cdn.8thwall.com/xr-jse-24.0.10.2165.js");
                    //                 }
                    //             }, 15);

                    //         }).catch(error => {
                    //             console.error('Error loaded xr-jse script:', error);
                    //         });
                    //     } else {

                    //     }
                    // }
                });

                window.onerror = function (message, source, lineno, colno, error) {
                    // console.log("onerror", message, source, lineno, colno, error);
                    if (message.includes('Uncaught TypeError: Cannot redefine property: XR')) {
                        console.log('https://cdn.8thwall.com/xr-jse-24.0.10.2165.js 被阻止XR');
                        return true;
                    }

                    // if (message.includes('Script error')) {
                    //     console.log('Script error 被拦截');
                    //     return true;
                    // }
                    return false;
                };

            } catch (error) {
                console.error('Error loaded xrweb script:', error);
            }
        }

        static rewrite8thScript(targetUrl, callBack) {
            let originalCreateElement = document.createElement.bind(document);
            document.createElement = function (tagName) {
                let thatDocument = originalCreateElement(tagName);
                let setATttr = thatDocument.setAttribute;
                if (tagName.toLowerCase() === "script" && !thatDocument.hasOwnProperty('src')) {
                    Object.defineProperty(thatDocument, "src", {
                        get: () => thatDocument ? thatDocument.getAttribute("src") : "",
                        set: src => [src.startsWith('https://cdn.8thwall.com/xr') ? src = targetUrl : null, thatDocument.setAttribute("src", src)]
                    })
                    thatDocument.setAttribute = (key, value) => [key === "src" ? thatDocument.onload = () => [callBack(value), thatDocument = null] : null,
                    setATttr.call(thatDocument, key, value)]
                }
                return thatDocument;
            }
        }

        async _isLoadComplete(callback) {
            if (Array.from(new Set(Init._loadJSOrCSS.concat(handNeedLoadJSOrCSS).map(JSON.stringify))).map(JSON.parse) == Init.scriptOrCSSTree.length) return callback({ success: true, type: "css" });
            const { _labelTypeName } = this;
            switch (Init.scriptOrCSSTree[Init.scriptOrCSSTree.length - 1].localName) {
                case _labelTypeName[0]:
                    if (Init._loadJSOrCSS.length == Init.scriptOrCSSTree.length) {
                        Init.scriptOrCSSTree[Init.scriptOrCSSTree.length - 1].onload = async () => {
                            return callback({ success: true, type: "js" });
                        }
                    }
                    break;
                case _labelTypeName[1]:
                    if (Init._loadJSOrCSS.length == Init.scriptOrCSSTree.length) {
                        Init.scriptOrCSSTree[Init.scriptOrCSSTree.length - 1].onload = async () => {
                            return callback({ success: true, type: "css" });
                        }
                    }
                    break;
                default:
                    break;
            }
        }

        _isCheckAppKey(config, callback) {
            if (config.appKey && config.appKey !== null) {
                Init._loadJSOrCSS.splice(Init._loadJSOrCSS.length - 1, 1, { src: `https://apps.8thwall.com/xrweb?appKey=${config.appKey}`, type: 1, });
                callback({ success: true })
            }
            else {
                return callback({ success: false, errors: "APPKEY can not be empty , Please Check APPKEY" })
            };
        }

        _errorsAlert(message, title, errorMessage) {
            window.mui.alert(message, title, ["确定"], ({ index, value }) => this._errors({ success: false, message: errorMessage }), 'div');
        }

        static injectSensorsdata() {
            Init._checkLoadType({ src: `https://metaverse-jwar-release.oss-cn-shanghai.aliyuncs.com/WeChat/PluginRepositories/Sensorsdata/Pro/sensorsdata.min.js`, type: 1, }).then(() => {
                Init.Sensors = window['sensorsDataAnalytic201505'];
                const { Sensors } = Init;
                if (Sensors) {

                    // Sensors.registerPropertyPlugin({
                    //     properties: function (data) {
                    //         data.distinct_id = SpatialRecognition.getUrlParam("distinct_id");
                    //     }
                    // })

                    Sensors.init({
                        server_url: location.host == "minigame.shengydt.com" ? "https://gather.gmoregalaxy.com/sa" : location.host == "meta-unitympro.shengydt.com" ? "https://gather.gmoregalaxy.com/sa?project=Metaverse" : "https://gather.gmoregalaxy.com/sa",
                        is_track_single_page: false,
                        send_type: 'ajax',
                        show_log: location.host == "minigame.shengydt.com" ? true : location.host == "meta-unitympro.shengydt.com" ? false : false,
                        encrypt_cookie: true,
                        heatmap: {
                            // scroll_notice_map: 'default',
                            // scroll_delay_time: 4000,
                            // scroll_event_duration: 18000,//单位秒，预置属性停留时长 event_duration 的最大值。默认5个小时，也就是300分钟，18000秒。
                            clickmap: 'not_collect',
                            encrypt_cookie: true,
                            get_vtrack_config: true,
                            collect_tags: {
                                div: true,
                                button: true,
                                li: true,
                                img: true,
                                canvas: true
                            }
                        },
                    });

                    //  公共属性
                    Sensors.registerPage({
                        // is_login: () => /MicroMessenger/i.test(window.navigator.userAgent),
                        // platform_name: () => /MicroMessenger/i.test(window.navigator.userAgent) == true ? "游历星河小程序" : "H5",
                        // platform_version: () => /MicroMessenger/i.test(window.navigator.userAgent) == true ? "v1.2.5" : "1.2.9",
                        is_login: () => SpatialRecognition.getUrlParam("is_login"),
                        platform_name: () => SpatialRecognition.getUrlParam("platform_name"),
                        platform_version: () => SpatialRecognition.getUrlParam("platform_version"),
                    });

                    Sensors.login(SpatialRecognition.getUrlParam("distinct_id"))

                    // Sensors.registerPropertyPlugin({
                    //     properties: function (data) {
                    //         data.distinct_id = "123";
                    //     }
                    // })

                    Sensors.quick('autoTrack', { platform: 'h5' });
                }
            })
        }

        static sendSensorsTrack(eventName, propertyObject) {

            if (Init.Sensors && Init.Sensors.track) {
                // Sensors.registerPropertyPlugin({
                //     properties: function (data) {
                //         data.distinct_id = "123";
                //         data.properties.distinct_id = "456";
                //     }
                // })
                Init.Sensors.track(eventName, propertyObject);
            }
        }
    }

    ImmersalPipeline.outputVersion(window.ossVersion ? window?.ossVersion["8thwall"].Version : "1.1.4", window.ossVersion ? window?.ossVersion["8thwall"]?.Cenvironment : location.host == "minigame.shengydt.com" ? "Dev" : location.host == "meta-unitympro.shengydt.com" ? "Pro" : window?._xr8?.Cenvironment ?? "Dev");
    return exports;
})));