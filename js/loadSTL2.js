// custom global variables
function trim (str) {
	str = str.replace(/^\s+/, '');
	for (var i = str.length - 1; i >= 0; i--) {
		if (/\S/.test(str.charAt(i))) {
			str = str.substring(0, i + 1);
			break;
		}
	}
	return str;
}

// Notes:
// - STL file format: http://en.wikipedia.org/wiki/STL_(file_format)
// - 80 byte unused header
// - All binary STLs are assumed to be little endian, as per wiki doc
// XXX modified by Armand Niederberger: normalized to a unit bounding box centered at zero.
var parseStlBinary = function(stl, color) {
	var col = 0;
	if (color == undefined) { 
		col = 0xffffff;
	} else {
		col = color;
	}
	var geo = new THREE.Geometry();
	var dv = new DataView(stl, 80); // 80 == unused header
	var isLittleEndian = true;
	var triangles = dv.getUint32(0, isLittleEndian); 

	// console.log('arraybuffer length:  ' + stl.byteLength);
	// console.log('number of triangles: ' + triangles);

	var offset = 4;
    
    offset = 16;
	var currentvertex = new THREE.Vector3( dv.getFloat32(offset, isLittleEndian), dv.getFloat32(offset+4, isLittleEndian), dv.getFloat32(offset+8, isLittleEndian) ) ;
    var maxx = currentvertex.x;
    var maxy = currentvertex.y;
    var maxz = currentvertex.z;
    var minx = currentvertex.x;
    var miny = currentvertex.y;
    var minz = currentvertex.z;
    
    offset = 4;
    for (var i = 0; i < triangles; i++) {
		// Get the normal for this triangle
		offset += 12;

		// Get all 3 vertices for this triangle
		for (var j = 0; j < 3; j++) {
			currentvertex = new THREE.Vector3( dv.getFloat32(offset, isLittleEndian), dv.getFloat32(offset+4, isLittleEndian), dv.getFloat32(offset+8, isLittleEndian) ) ;
            if (currentvertex.x > maxx) maxx = currentvertex.x;
            if (currentvertex.y > maxy) maxy = currentvertex.y;
            if (currentvertex.z > maxz) maxz = currentvertex.z;
            if (currentvertex.x < minx) minx = currentvertex.x;
            if (currentvertex.y < miny) miny = currentvertex.y;
            if (currentvertex.z < minz) minz = currentvertex.z;
			offset += 12
		}

		// there's also a Uint16 "attribute byte count" that we
		// don't need, it should always be zero.
		offset += 2;   
	}
    dx = (maxx - minx);
    dy = (maxy - miny);
    dz = (maxz - minz);
    cx = 0.5*(minx + maxx);
    cy = 0.5*(miny + maxy);
    cz = 0.5*(minz + maxz);
    dd = Math.max(dx, Math.max(dy, dz));

    offset = 4; // reset offset to 4
    //console.log(minx, maxx, miny, maxy, minz, maxz);
    //console.log(dx, dy, dz, cx, cy, cz);
	for (var i = 0; i < triangles; i++) {
		// Get the normal for this triangle
		var normal = new THREE.Vector3(
			dv.getFloat32(offset, isLittleEndian),
			dv.getFloat32(offset+4, isLittleEndian),
			dv.getFloat32(offset+8, isLittleEndian)
		);
		offset += 12;

		// Get all 3 vertices for this triangle
		for (var j = 0; j < 3; j++) {
            currentvector = new THREE.Vector3( dv.getFloat32(offset, isLittleEndian), dv.getFloat32(offset+4, isLittleEndian), dv.getFloat32(offset+8, isLittleEndian) );
            currentvector.x = (currentvector.x - cx)/dd;
            currentvector.y = (currentvector.y - cy)/dd;
            currentvector.z = (currentvector.z - cz)/dd;

			geo.vertices.push( currentvector );
			//geo.vertices.push( new THREE.Vector3( dv.getFloat32(offset, isLittleEndian), dv.getFloat32(offset+4, isLittleEndian), dv.getFloat32(offset+8, isLittleEndian) ) );
			offset += 12
		}

		// there's also a Uint16 "attribute byte count" that we
		// don't need, it should always be zero.
		offset += 2;   

		// Create a new face for from the vertices and the normal             
		geo.faces.push(new THREE.Face3(i*3, i*3+1, i*3+2, normal));
	}

	// The binary STL I'm testing with seems to have all
	// zeroes for the normals, unlike its ASCII counterpart.
	// We can use three.js to compute the normals for us, though,
	// once we've assembled our geometry. This is a relatively 
	// expensive operation, but only needs to be done once.
	geo.computeFaceNormals();

	mesh = new THREE.Mesh( 
	geo,
	// new THREE.MeshNormalMaterial({
	//     overdraw:true
	// }
	//new THREE.MeshLambertMaterial({
	new THREE.MeshPhongMaterial({
	overdraw:true,
	//color: 0x00aa00,
	color: col,
	//wireframe:true,
	shading: THREE.FlatShading
	}
	));
	//var resizeParam = 5.0;
	//var resizeParam = 1.0;
	//mesh.scale.set(resizeParam, resizeParam, resizeParam);
	//mesh.rotateX(  Math.PI/2 );
	//scene.add(mesh);
	stl = null;
	return mesh;
};  

var parseStl = function(stl) {
	var state = '';
	var lines = stl.split('\n');
	var geo = new THREE.Geometry();
	var name, parts, line, normal, done, vertices = [];
	var vCount = 0;
	stl = null;

	for (var len = lines.length, i = 0; i < len; i++) {
		if (done) {
		break;
		}
		line = trim(lines[i]);
		parts = line.split(' ');
		switch (state) {
			case '':
				if (parts[0] !== 'solid') {
					console.error(line);
					console.error('Invalid state "' + parts[0] + '", should be "solid"');
					return;
				} else {
					name = parts[1];
					state = 'solid';
				}
				break;
			case 'solid':
				if (parts[0] !== 'facet' || parts[1] !== 'normal') {
					console.error(line);
					console.error('Invalid state "' + parts[0] + '", should be "facet normal"');
					return;
				} else {
					normal = [ parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])
					];
					state = 'facet normal';
				}
				break;
			case 'facet normal':
				if (parts[0] !== 'outer' || parts[1] !== 'loop') {
					console.error(line);
					console.error('Invalid state "' + parts[0] + '", should be "outer loop"');
					return;
				} else {
					state = 'vertex';
				}
				break;
			case 'vertex': 
				if (parts[0] === 'vertex') {
					geo.vertices.push(new THREE.Vector3( parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]) ));
				} else if (parts[0] === 'endloop') {
					geo.faces.push( new THREE.Face3( vCount*3, vCount*3+1, vCount*3+2, new THREE.Vector3(normal[0], normal[1], normal[2]) ) );
					vCount++;
					state = 'endloop';
				} else {
					console.error(line);
					console.error('Invalid state "' + parts[0] + '", should be "vertex" or "endloop"');
					return;
				}
				break;
			case 'endloop':
				if (parts[0] !== 'endfacet') {
					console.error(line);
					console.error('Invalid state "' + parts[0] + '", should be "endfacet"');
					return;
				} else {
					state = 'endfacet';
				}
				break;
			case 'endfacet':
				if (parts[0] === 'endsolid') {
					//mesh = new THREE.Mesh( geo, new THREE.MeshNormalMaterial({overdraw:true}));
					mesh = new THREE.Mesh( geo, new THREE.MeshLambertMaterial({ overdraw:true, color: 0xaa0000, shading: THREE.FlatShading } ));
					//scene.add(mesh);
					done = true;
				} else if (parts[0] === 'facet' && parts[1] === 'normal') {
					normal = [ parseFloat(parts[2]),  parseFloat(parts[3]),  parseFloat(parts[4]) ];
					if (vCount % 1000 === 0) {
						//console.log(normal);
					}
					state = 'facet normal';
				} else {
					console.error(line);
					console.error('Invalid state "' + parts[0] + '", should be "endsolid" or "facet normal"');
					return;
				}
				break;
			default:
				console.error('Invalid state "' + state + '"');
				break;
		}
	}
	return mesh;
};

