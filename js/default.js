var camera, renderer, scene;
var group;
var g_hour = 0;
var g_minute = 0;
var g_AMPM = "AM";
var material;
var MeshHH, GeoMM, GeoAM;
var bInitTimeObject = false;
window.onload = function () {
  Init();
  animate();
};

function Init() {
  LEIA.virtualScreen.Init();
  LEIA.physicalScreen.InitFromExternalJson('https://s3.amazonaws.com/leiacore/config.json');
  LEIA.physicalScreen.resolution = new THREE.Vector2(200,150);
  scene = new THREE.Scene();
  group = new THREE.Object3D();

  //setup camera
  camera = new LeiaCamera({
    dCtoZDP: LEIA.virtualScreen.d,
    zdpNormal: LEIA.virtualScreen.normal,
    targetPosition: LEIA.virtualScreen.center
  });
  scene.add(camera);

  //setup rendering parameter
  renderer = new LeiaWebGLRenderer({
    antialias: true,
    renderMode: _renderMode,
    colorMode: _colorMode,
    devicePixelRatio: 1,
    messageFlag: _targetEnvironment
  });
  renderer.setClearColor(new THREE.Color()
    .setRGB(1.0, 1.0, 1.0));
  renderer.shadowMapEnabled = true;
  //  renderer.shadowMapType = THREE.BasicShadowMap;
  Leia_addRender(renderer, {
    bFPSVisible: true
  });

  //add object to Scene
  addObjectsToScene();

  //add Light
  addLights();
}

function animate() {
  requestAnimationFrame(animate);
  var date = new Date(Date.now());
  var minute = date.getMinutes(); //date.getSeconds();
  var hour = date.getHours();
  if (g_hour != hour) {
    g_hour = hour;
    UpateTimeObject();
  }
  if (g_minute != minute) {
    g_minute = minute;
    UpateTimeObject();
  }

  group.rotation.x = 0.8 * Math.sin(5.0 * LEIA.time);
  group.rotation.z = 0.6 * 0.6 * Math.sin(3.0 * LEIA.time);
  //  
  renderer.Leia_render({
    scene: scene,
    camera: camera
  });
}

function UpateTimeObject() {
  if (bInitTimeObject === true) {
    scene.remove(group);
    group = new THREE.Object3D();

    // console.log("remove");
  }
  bInitTimeObject = true;
  var AMPMHH = g_hour;
  if (AMPMHH > 12) {
    AMPMHH = AMPMHH - 12;
  }
  if (AMPMHH === 0) {
    AMPMHH = 12;
  }
  var strHour = AMPMHH.toString();
  if (AMPMHH < 10)
    strHour = "0" + strHour;

  GeoHH = new THREE.TextGeometry(strHour, {
    size: 12,
    height: 2,
    curveSegments: 4,
    font: "helvetiker",
    weight: "normal",
    style: "normal",
    bevelThickness: 0.5,
    bevelSize: 0.5,
    bevelEnabled: true,
    material: 0,
    extrudeMaterial: 1
  });

  var strMinutes = g_minute.toString();
  if (g_minute < 10)
    strMinutes = "0" + strMinutes;
  GeoMM = new THREE.TextGeometry(strMinutes, {
    size: 6,
    height: 2,
    curveSegments: 4,
    font: "helvetiker",
    weight: "normal",
    style: "normal",
    bevelThickness: 0.5,
    bevelSize: 0.5,
    bevelEnabled: true,
    material: 0,
    extrudeMaterial: 1
  });
  if (g_hour >= 12) {
    g_AMPM = "PM";
  } else {
    g_AMPM = "AM";
  }
  GeoAM = new THREE.TextGeometry(g_AMPM, {
    size: 3,
    height: 2,
    curveSegments: 4,
    font: "helvetiker",
    weight: "normal",
    style: "normal",
    bevelThickness: 0.6,
    bevelSize: 0.25,
    bevelEnabled: true,
    material: 0,
    extrudeMaterial: 1
  });

  GeoHH.computeBoundingBox();
  GeoHH.computeVertexNormals();
  var MeshHH = new THREE.Mesh(GeoHH, material);
  GeoMM.computeBoundingBox();
  GeoMM.computeVertexNormals();
  var MeshMM = new THREE.Mesh(GeoMM, material);
  GeoAM.computeBoundingBox();
  GeoAM.computeVertexNormals();
  var MeshAM = new THREE.Mesh(GeoAM, material);
  var HHdx = GeoHH.boundingBox.max.x - GeoHH.boundingBox.min.x;
  var HHdy = GeoHH.boundingBox.max.y - GeoHH.boundingBox.min.y;
  var MMdx = GeoMM.boundingBox.max.x - GeoMM.boundingBox.min.x;
  var MMdy = GeoMM.boundingBox.max.y - GeoMM.boundingBox.min.y;
  var AMdx = GeoAM.boundingBox.max.x - GeoAM.boundingBox.min.x;
  var AMdy = GeoAM.boundingBox.max.y - GeoAM.boundingBox.min.y;
  MeshHH.position.set(-8 - 0.5 * HHdx, -0.5 * HHdy, 0);
  MeshMM.position.set(8 - 0.5 * MMdx, -3 - 0.5 * MMdy, 0);
  MeshAM.position.set(9 - 0.5 * AMdx, 4 - 0.5 * AMdy, 0);
  MeshHH.castShadow = true;
  MeshHH.receiveShadow = true;
  MeshMM.castShadow = true;
  MeshMM.receiveShadow = true;
  MeshAM.castShadow = true;
  MeshAM.receiveShadow = true;
  group.add(MeshHH);
  group.add(MeshMM);
  group.add(MeshAM);
  scene.add(group);
}

function addObjectsToScene() {
  colstr = rgbstr(255, 255, 255);
  //Add your objects here
  material = new THREE.MeshFaceMaterial([
        new THREE.MeshPhongMaterial({
      color: colstr,
      shading: THREE.FlatShading
    }), // front
        new THREE.MeshPhongMaterial({
      color: colstr,
      shading: THREE.SmoothShading
    }) // side
    ]);
  UpateTimeObject();
  // LEIA_setBackgroundPlane('resource/brickwall_900x600_small.jpg');
  var backgroundPlane = Leia_createTexturePlane({
    filename: 'resource/brickwall_900x600_small.jpg',
    width: 80,
    height: 60
  });
  backgroundPlane.position.z = -6;
  backgroundPlane.castShadow = false;
  backgroundPlane.receiveShadow = true;
  scene.add(backgroundPlane);
}

function addLights() {
  //Add Lights Here
  var light = new THREE.SpotLight(0xffffff);
  //light.color.setHSL( Math.random(), 1, 0.5 );
  light.position.set(0, 60, 60);
  light.shadowCameraVisible = false;
  light.castShadow = true;
  light.shadowMapWidth = light.shadowMapHeight = 256;
  light.shadowDarkness = 0.7;
  scene.add(light);

  var ambientLight = new THREE.AmbientLight(0x222222);
  scene.add(ambientLight);
}

//Function to convert hex format to a rgb color
function rgbstr(r, g, b) {
  return 'rgb(' + r + ',' + g + ',' + b + ')';

}
