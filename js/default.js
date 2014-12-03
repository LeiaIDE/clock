var windowWidth = window.innerWidth, windowHeight = window.innerHeight;
var camera,renderer,scene;
var group;
var f= "helvetiker"; 
var lf1 = f;
var lf2 = f;
var lf3 = f;
var g_hour = 0;
var g_minute = 0;
var g_AMPM = "AM";
var material = new THREE.MeshFaceMaterial( [ 
  new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.FlatShading } ), // front
  new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.SmoothShading } ) // side
] );
var MeshHH,GeoMM,GeoAM;
var bInitTimeObject = false;
 window.onload = function (){
     console.log("onload");
     Init();
     animate();
 };

function Init(){
        scene = new THREE.Scene();
        group = new THREE.Object3D();
  
       //setup camera
 		camera = new LeiaCamera();
        camera.position.copy(new THREE.Vector3(_camPosition.x, _camPosition.y, _camPosition.z));
        camera.lookAt(new THREE.Vector3(_tarPosition.x, _tarPosition.y, _tarPosition.z));
        scene.add(camera);
  
       //setup rendering parameter
 		renderer = new LeiaWebGLRenderer({
         antialias:true, 
 		renderMode: _renderMode, 
		shaderMode: _nShaderMode,
          colorMode: _colorMode,
		devicePixelRatio: 1 
        } );
 		renderer.Leia_setSize( windowWidth, 0.75*windowWidth );
        renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true;
 		document.body.appendChild( renderer.domElement );
  
       //add object to Scene
        addObjectsToScene();
  
        //add Light
 		addLights();
 }

 function animate() 
 {
 	requestAnimationFrame( animate );
    var date = new Date(Date.now());
    var minute = date.getMinutes();//date.getSeconds();
    var hour = date.getHours();
   if(g_hour != hour){
      g_hour = hour;
      UpateTimeObject();
   }
    if(g_minute != minute){
      g_minute = minute;
      UpateTimeObject();
   }

    group.rotation.z =  0.6*Math.sin(3.0*Date.now() * 0.001);
    renderer.setClearColor(new THREE.Color().setRGB(1.0, 1.0, 1.0)); 
	renderer.Leia_render(scene, camera,undefined,undefined,_holoScreenSize,_camFov,_messageFlag);
 }
function UpateTimeObject(){
   if(bInitTimeObject === true){
      scene.remove(group);
      group = new THREE.Object3D();
      
     // console.log("remove");
   }
   bInitTimeObject = true;
  var AMPMHH = g_hour;
  if (AMPMHH > 12) { AMPMHH = AMPMHH - 12;}
  if (AMPMHH === 0) { AMPMHH = 12;}
  var strHour = AMPMHH.toString();
  if(AMPMHH < 10)
    strHour = "0" + strHour;
  
   GeoHH = new THREE.TextGeometry( strHour, {size: 12, height: 2, curveSegments: 4, font: lf1, weight: "normal", style: "normal", bevelThickness: 0.5, bevelSize: 0.25, bevelEnabled: true, material: 0, extrudeMaterial: 1 });
  
   var strMinutes = g_minute.toString();
  if(g_minute < 10)
    strMinutes = "0" + strMinutes;
   GeoMM = new THREE.TextGeometry( strMinutes, {size: 6, height: 2, curveSegments: 4, font: lf2, weight: "normal", style: "normal", bevelThickness: 0.5, bevelSize: 0.25, bevelEnabled: true, material: 0, extrudeMaterial: 1 });
  if(g_hour >= 12){
    g_AMPM = "PM";
  }else{
    g_AMPM = "AM";
  }
   GeoAM = new THREE.TextGeometry( g_AMPM, {size: 3, height: 2, curveSegments: 4, font: lf3, weight: "normal", style: "normal", bevelThickness: 0.6, bevelSize: 0.25, bevelEnabled: true, material: 0, extrudeMaterial: 1 });
	
	GeoHH.computeBoundingBox();	
	GeoHH.computeVertexNormals();	
	var MeshHH = new THREE.Mesh( GeoHH, material );
	GeoMM.computeBoundingBox();	
	GeoMM.computeVertexNormals();	
	var MeshMM = new THREE.Mesh( GeoMM, material );
	GeoAM.computeBoundingBox();	
	GeoAM.computeVertexNormals();	
	var MeshAM = new THREE.Mesh( GeoAM, material );
	var HHdx = GeoHH.boundingBox.max.x - GeoHH.boundingBox.min.x;	
	var HHdy = GeoHH.boundingBox.max.y - GeoHH.boundingBox.min.y;
	var MMdx = GeoMM.boundingBox.max.x - GeoMM.boundingBox.min.x;	
	var MMdy = GeoMM.boundingBox.max.y - GeoMM.boundingBox.min.y;
	var AMdx = GeoAM.boundingBox.max.x - GeoAM.boundingBox.min.x;	
	var AMdy = GeoAM.boundingBox.max.y - GeoAM.boundingBox.min.y;
	MeshHH.position.set(-8-0.5*HHdx,   -0.5*HHdy, 0);
	MeshMM.position.set( 8-0.5*MMdx, -3-0.5*MMdy, 0);
	MeshAM.position.set( 9-0.5*AMdx,  4-0.5*AMdy, 0);
	MeshHH.castShadow = true;
    MeshHH.receiveShadow = true;
	MeshMM.castShadow = true;
    MeshMM.receiveShadow = true;
	MeshAM.castShadow = true;
	MeshAM.receiveShadow = true;
    group.add( MeshHH );
	group.add( MeshMM );
	group.add( MeshAM );
    scene.add(group);
}

function addObjectsToScene(){
    //Add your objects here
  UpateTimeObject();
  LEIA_setBackgroundPlane('resource/brickwall_900x600_small.jpg');
}

function addLights(){
    //Add Lights Here
 	var light = new THREE.SpotLight( 0xffffff);
	//light.color.setHSL( Math.random(), 1, 0.5 );
 	light.position.set(0,60,60);
    light.shadowCameraVisible = false;
    light.castShadow = true;
    light.shadowMapWidth = light.shadowMapHeight = 512;
    light.shadowDarkness = 0.7;
 	scene.add(light);
  
 	var ambientLight = new THREE.AmbientLight(0x222222);	
 	scene.add(ambientLight);
}

function LEIA_setBackgroundPlane(filename, aspect){
	var foregroundPlaneTexture = new THREE.ImageUtils.loadTexture( filename );
	foregroundPlaneTexture.wrapS = foregroundPlaneTexture.wrapT = THREE.RepeatWrapping; 
	foregroundPlaneTexture.repeat.set( 1, 1 );
	
  //
    var planeMaterial = new THREE.MeshPhongMaterial( {map: foregroundPlaneTexture, color: 0xffdd99 } );
    var planeGeometry = new THREE.PlaneGeometry(80, 60, 10, 10);
	plane = new THREE.Mesh(planeGeometry,   planeMaterial);
	plane.position.z = -6;
	plane.castShadow = false;
	plane.receiveShadow = true;
	scene.add(plane);
}