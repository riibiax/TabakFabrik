var TabakFabrik = (function() {

	var isPlaying=true;
	var timedelta=0;
	var timedeltaTmp=0;	

	var tabak = {};
	var textures = {};

	//GENERAL SETTINGS
	var WIDTH = window.innerWidth;
	var HEIGHT = window.innerHeight;
	var clock = new THREE.Clock();
	var time;
	var currentTime = 0;
	var startTime;
	var delta;
	var loadedAssets = 0;
    var music;
    var volume = 0.75;
	var renderer, canvas, camera;

	var models;
	var scenes = [];
	var scenesPos = [];
	var randomIndex=0;
	var intervalId=0;
	var currentScene;

	//POSTPROCESSING
	var composer;
	var bComposer=false;
	var bTrails=false;
	var planeTrails;
	var fadePlane;

	//PARTICLES
	var particleSystem;
	var particles = 100000;
	var radius = 2000;//radius della sfera che contiene le particelle all'inizio
	var custompositiona;
	var custompositionb;
	var glow;
	//SHADERS
	var sceneShaders = [];
   	var shadersUniforms;
   	//TERRAIN
   	var terrain;
   	//CLOUDS
	var clouds;
	//BUILDINGS POINTS
   	var buildingsPoints;
	//SPACE DISTORSION
	var space;
	var spacePoints;
	//MACHINE
	var machine;
	//ROBOT
	var robot;

	//var capturer;
	//toggle Play Pause button from iframe
	tabak.togglePlay = function() {
		if(!isPlaying){
			startTime= Date.now() - currentTime;
			timedelta += window.performance.now() - timedeltaTmp;
		}
		else {
			timedeltaTmp=window.performance.now();
		}	
		isPlaying= !isPlaying;	
	}
	tabak.init = function() {
		canvas = document.getElementById( "c" );
		preload();

	}
	// preload
	var preload = function () {
		//Plane for Trails
		planeTrails = new THREE.Mesh( new THREE.PlaneGeometry( 20000, 10000 ), new THREE.MeshBasicMaterial( { color: 0x000000,transparent: true, opacity: 0.1 } ) );
		planeTrails.position.z = -3000;
		//Plane for fade and flickering
		fadePlane = new THREE.Mesh( new THREE.PlaneGeometry( 3, 1.5 ), new THREE.MeshBasicMaterial( { color: 0x000000,transparent: true, opacity: 0.0 } ) );
		fadePlane.position.z = 3999;
	    //textures
	    createTextures();
	    //scenes
		createParticleSystem();
		createTerrain();
		createBuildingsPoints(aespoints, entranceexternepoints);
		createPacketDistorsion();
		createMachine();
		createRobot();
		createBlackEmptyScene();
		createModels();
		//shaders
		createShaders();
		//audio
		loadAudio();
	}

	var createTextures = function () {
	    textures.map = new THREE.TextureLoader().load( "img/spark1.png", undefined, assetLoaded() );
	    textures.iChannel1= new THREE.TextureLoader().load( "img/noise01.png", undefined, assetLoaded() );
		textures.iChannel2= new THREE.TextureLoader().load( "img/noise02.png", undefined, assetLoaded() );
		textures.iChannel1.wrapS = textures.iChannel2.wrapS = THREE.RepeatWrapping;
		textures.iChannel1.wrapT = textures.iChannel2.wrapT =THREE.RepeatWrapping;
		textures.cloud = new THREE.TextureLoader().load( 'img/cloud10.png', undefined, assetLoaded());
		textures.cloud.magFilter = textures.cloud.minFilter= THREE.LinearMipMapLinearFilter;
		var path = 'img/cubes/';
		var format = '.png';
		var urls = [path + 'pos1-x' + format, path + 'neg1-x' + format,
					path + 'pos1-y' + format, path + 'neg1-y' + format,
					path + 'pos1-z' + format, path + 'neg1-z' + format];
		textures.cube1 = new THREE.CubeTextureLoader().load( urls, undefined, assetLoaded() );
		urls = [path + 'pos2-x' + format, path + 'neg2-x' + format,
				path + 'pos2-y' + format, path + 'neg2-y' + format,
				path + 'pos2-z' + format, path + 'neg2-z' + format];
		textures.cube2 = new THREE.CubeTextureLoader().load( urls, undefined, assetLoaded() );
		urls = [path + 'pos3-x' + format, path + 'neg3-x' + format,
				path + 'pos3-y' + format, path + 'neg3-y' + format,
				path + 'pos3-z' + format, path + 'neg3-z' + format];
		textures.cube3 = new THREE.CubeTextureLoader().load( urls, undefined, assetLoaded() );
		textures.cube1.format =textures.cube2.format =textures.cube3.format = THREE.RGBFormat;
	}

	var setupCamera = function () {
	    camera = new THREE.PerspectiveCamera( 60, WIDTH / HEIGHT, 1, 10000 );
		camera.position.z = 4000;
	}

	var loadAudio = function () {
		
       /* if (Audio != undefined) {
          var a = new Audio();
          var ext = "ogg";
          if(a.canPlayType("audio/mp3")) ext = "mp3";
          music = new Audio("assets/audio."+ext);
          music.volume = volume;
          music.load();

          music.addEventListener("loadeddata", function() {

            assetLoaded();

          }, false);

        } else {
          assetLoaded();
        }*/

	}

	var assetLoaded = function () {
		++loadedAssets;
		//attenzione perché se il valore max non è giusto, si chiama + volte la funzione start
		if (loadedAssets == 16) {
			allLoaded();
		}

	}

	var allLoaded = function () {
		// fade out loader
		var spinner = document.getElementById('loading_spinner');
		spinner.style.opacity = 1.0

        var outTween = new TWEEN.Tween( spinner.style )
            .to( { opacity: 0.1 }, 1500 )
            .easing( TWEEN.Easing.Quadratic.In )
            .onComplete(function () {
            	spinner.style.display = "none";
            });
    	outTween.start();

    	tabak.start();

	}

	tabak.start = function () {
		setup();
		startTime = Date.now();
		if (music) {
			music.play();
		}
		animate();
	}

	var getTime = function () {
		if (music) {
			return music.currentTime*1000;
		}
		return time - startTime;
	}

	// setup
	var setup = function () {
		
		//sort scenes array !IMPORTANT ==>indexing
		scenes.sort(function(a, b){
 			return a.name-b.name
		})
		//camera
	    setupCamera();
		
		// Sequences
		var seq0 = new Sequence( 0 );
		seq0.start = function () 
		{
			console.log("start 0");
			setCurrentScene(0);
			particleSystem.position.z = -5000;
			var tween = new TWEEN.Tween(particleSystem.position)
					.to({z: 0}, 10000)
					.delay(1000)
					.easing(TWEEN.Easing.Quadratic.Out);
			tween.start();
			//capturer = new CCapture( { format: 'gif', framerate: 60, verbose: false, name: 'universe', workersPath: './gif/'} );
			//capturer = new CCapture( { format: 'png', framerate: 60, verbose: false, name: 'universe', quality: 100} );
			//capturer = new CCapture( { format: 'webm', framerate: 60, verbose: false, name: 'universe', quality:100} );
			//capturer.start();
			//capturer.stop();
			//capturer.save();
		}
		seq0.start();
		seq0.update = function () 
		{
			renderScene(currentScene);
		}

		var seq1 = new Sequence( 11000 );
		seq1.start = function () 
		{ 
			console.log("start 1");
			seq1.transition = false;
			createDrawing(10000, 13000, 4000, 1.0);

		}
		seq1.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 36000 && !seq1.transition)
			{
				seq1.transition = true;
				destroyDrawing(5000);
			}
		}

		var seq2 = new Sequence( 43000 );
		seq2.start = function () 
		{
			console.log("start 2");
			seq2.transition = false;
			createDrawing(10000, 13000, 0, 0.0);
		}
		seq2.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 68000 && !seq2.transition)
			{
				seq2.transition = true;
				destroyDrawing(5000);
			}
		}

		var seq3 = new Sequence( 75000 );
		seq3.start = function () 
		{
			console.log("start 3");
			setCurrentScene(6);
			setFlickering(0xffffff, 200, 4);

		}
		seq3.update = function () 
		{
			renderScene(currentScene);
		}

		var seq4 = new Sequence( 76000 );
		seq4.start = function () 
		{
			console.log("start 4");
			createScenesGrid(3,3,true);
			createRandomScenesPos(500);
		}
		seq4.update = function () 
		{
			renderScenes();
		}

		var seq5 = new Sequence( 81500 );
		seq5.start = function () 
		{
			console.log("start 5");
			seq5.transition = false;
			resetRenderer();
			setCurrentScene(1);
			setFlickering(0xffffff,500,0);	
			terrain.position.z=0;
			terrain.position.y-=50;		
			var atween = new TWEEN.Tween(terrain.position)
					.to({z: 7500}, 40000)
					.delay(3000)
					.easing(TWEEN.Easing.Linear.None)
					.onStart(function () {setFlickering(0x000000,2000,3);})
					.start();
			var btween = new TWEEN.Tween(terrain.position)
					.to({y: 250}, 6000)
					.repeat(10)
					.yoyo( true )
					.easing(TWEEN.Easing.Quadratic.InOut)
					.start();
			clouds.position.x=-12500;
			clouds.material.uniforms.activeRay.value=1;
			var ctween = new TWEEN.Tween(clouds.position)
					.to({x: 0}, 20000)
					.easing(TWEEN.Easing.Linear.None)
					.onComplete(function () {setFlickering(0x000000,2000,0);})
					.start();

		}
		seq5.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 103500 && !seq5.transition)
			{
				seq5.transition = true;
				clouds.material.uniforms.activeRay.value=0;
				var dtween = new TWEEN.Tween(clouds.position)
					.to({z: 12500}, 20000)
					.easing(TWEEN.Easing.Linear.None)
					.onComplete(function () {setFlickering(0xffffff,200,3);})
					.start();
			}
		}

		var seq6 = new Sequence( 125000 );
		seq6.start = function () 
		{
			TWEEN.removeAll();
			console.log("start 6");
			setCurrentScene(0);
			particleSystem.userData.bRotation=false;
			particleSystem.position.y = -15000;
			particleSystem.rotation.y = 0;
			var tween = new TWEEN.Tween(particleSystem.position)
				.to({y: 0}, 3000)
				.easing(TWEEN.Easing.Back.Out)
				.start();
		}
		seq6.update = function () 
		{
			renderScene(currentScene);
		}

		var seq7 = new Sequence( 129000 );
		seq7.start = function () 
		{
			console.log("start 7");
			seq7.transition = false;
			particleSystem.userData.bRotation = true;
			addTrails();
			updateParticleSystemCompositions(trainpoints, packetpoints, 400, 500);
			createDrawing(10000, 13000, 4000, 1.0);
		}
		seq7.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 153000 && !seq7.transition)
			{
				seq7.transition = true;
				destroyDrawing(5000);
			}
		}

		var seq8 = new Sequence( 160000 );
		seq8.start = function () 
		{

			console.log("start 8");
			seq8.transition = false;
			particleSystem.userData.bRotation = false;
			particleSystem.rotation.y=0.1;
			createDrawing(10000, 13000, 0, 0.0);
			setFlickering(0x000000, 2000, 3);
		}
		seq8.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 185000 && !seq8.transition)
			{
				seq8.transition = true;
				destroyDrawing(5000);
			}
		}
		var seq9 = new Sequence( 192000 );
		seq9.start = function () 
		{
			console.log("start 9");
			removeTrails();
			setCurrentScene(6);
			resetRenderer();
			setFlickering(0xffffff, 200, 3);
			
		}
		seq9.update = function () 
		{
			renderScene(currentScene);
		}
		var seq10 = new Sequence( 193000 ); 
		seq10.start = function () 
		{
			console.log("start 10");
			createScenesGrid(3,2,true);
			createRandomScenesPos(500);
		}
		seq10.update = function () 
		{
			renderShaders();
		}

		var seq11 = new Sequence( 198000 ); 
		seq11.start = function () 
		{
			console.log("start 11");
			resetRenderer();
		}
		seq11.update = function () 
		{
			renderShader(6);
		}

		var seq12 = new Sequence( 201000 ); 
		seq12.start = function () 
		{
			console.log("start 12");
		}
		seq12.update = function () 
		{
			renderShader(0);
		}

		var seq13 = new Sequence( 204000 ); 
		seq13.start = function () 
		{
			console.log("start 13");
		}
		seq13.update = function () 
		{
			renderShader(1);
		}

		var seq14 = new Sequence( 207000 ); 
		seq14.start = function () 
		{
			console.log("start 14");
		}
		seq14.update = function () 
		{
			renderShader(2);
		}

		var seq15 = new Sequence( 210000 ); 
		seq15.start = function () 
		{
			console.log("start 15");
		}
		seq15.update = function () 
		{
			renderShader(3);
		}

		var seq16 = new Sequence( 213000 ); 
		seq16.start = function () 
		{
			console.log("start 16");
		}
		seq16.update = function () 
		{
			renderShader(4);
		}

		var seq17 = new Sequence( 216000 ); 
		seq17.start = function () 
		{
			console.log("start 17");
		}
		seq17.update = function () 
		{
			renderShader(5);
		}

		var seq18 = new Sequence( 219000 );
		seq18.start = function () 
		{
			console.log("start 18");
			resetRenderer();
			setCurrentScene(3);
			setFade(0xffffff, 500, "out");
			var atween = new TWEEN.Tween(spacePoints.rotation)
					.to({ x: ( Math.PI *0.5)}, 10000)
					.delay(1500)
					.easing(TWEEN.Easing.Quadratic.Out)
					.onStart(function () {
						setFlickering(0x000000, 1000, 3);})
					.onComplete(function () {
						setFlickering(0x000000, 1000, 3);
						spacePoints.userData.bAnimation = true; 
						spacePoints.material.uniforms.lightNear.value = 10.0;
						spacePoints.material.uniforms.lightFar.value = 175.0;}
					);
			var btween = new TWEEN.Tween(space.rotation)
					.to({ x:( Math.PI *0.5)}, 10000)
					.delay(1500)
					.easing(TWEEN.Easing.Quadratic.Out);
			var ctween = new TWEEN.Tween(spacePoints.position)
					.to({x:50, y:30, z: 4200}, 90000)
					.easing(TWEEN.Easing.Cubic.Out);
			var dtween = new TWEEN.Tween(space.position)
					.to({x:50, y:30, z:4200}, 90000)
					.easing(TWEEN.Easing.Cubic.Out);
			atween.chain(ctween);
			btween.chain(dtween);
			atween.start();
			btween.start();
		}
		seq18.update = function () 
		{
			renderScene(currentScene);
		}

		var seq19 = new Sequence( 293000 ); 
		seq19.start = function () 
		{
			console.log("start 19");
			seq19.transition = false;
			TWEEN.removeAll();
			particleSystem.userData.bRotation=false;
			setCurrentScene(0);
			setFade(0xffffff, 500, "out");
			updateParticleSystemCompositions(mainbuildingpoints, robotpoints, 700, 500);
			particleSystem.position.z = -5000;
			particleSystem.rotation.y = 0;
			particleSystem.scale.set(0.01,0.01,1.0);
			var tween = new TWEEN.Tween(particleSystem.scale)
					.to({x: 1.0, y:1.0}, 1500)
					.easing(TWEEN.Easing.Cubic.Out)
					.delay(2000)
					.onStart(function () {particleSystem.position.z = 0;});
			tween.start();
			addTrails();
		}
		seq19.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 297500 && !seq19.transition) 
			{
				seq19.transition = true;
				particleSystem.material.uniforms.activateFlickering.value=1;
				var tweenZoom = new TWEEN.Tween(particleSystem.position)
					.to({z:4000}, 10000)
					.easing(TWEEN.Easing.Quadratic.Out)
					.start();
			}
		}

		var seq20 = new Sequence( 308000 );
		seq20.start = function () 
		{
			console.log("start 20");
			seq20.transition = false;
			removeTrails();
			particleSystem.material.uniforms.direction.value = 1.0;
			var atween = new TWEEN.Tween(particleSystem.material.uniforms.amplitude)
				.to({value: 1}, 10000)
				.easing(TWEEN.Easing.Back.InOut);
			atween.start();
		}

		seq20.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 320000 && !seq20.transition)
			{
				seq20.transition = true;
				setCurrentScene(6);
				particleSystem.position.z = 3750;
				particleSystem.rotation.x = 0.25; 
				particleSystem.rotation.y = 1.275;
			}
		}

		var seq21 = new Sequence( 322000 );
		seq21.start = function () 
		{
			console.log("start 21");
			seq21.transition = false;
			setCurrentScene(0);
		}
		seq21.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 325000  && !seq21.transition)
			{
				seq21.transition = true;
				setCurrentScene(6);
				particleSystem.position.z = 3550; 
				particleSystem.rotation.y = -1.4;
			}
		}
		var seq22 = new Sequence( 327000 );
		seq22.start = function () 
		{
			console.log("start 22");
			seq22.transition = false;
			setCurrentScene(0);
		}
		seq22.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 330000 && !seq22.transition)
			{
				seq22.transition = true;
				setCurrentScene(6);
				particleSystem.position.z = 3500;
				particleSystem.rotation.y = 0.7;
			}
		}
		var seq23 = new Sequence( 332000 );
		seq23.start = function () 
		{
			console.log("start 23");
			seq23.transition = false;
			setCurrentScene(0);

		}
		seq23.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 335000  && !seq23.transition)
			{
				seq23.transition = true;
				setCurrentScene(6);
				particleSystem.position.z = 1250;
				particleSystem.rotation.x = 0; 
				particleSystem.rotation.y = 0;
			}
		}

		var seq24 = new Sequence( 337000 );
		seq24.start = function () 
		{
			console.log("start 24");
			seq24.transition = false;
			setCurrentScene(0);
			var tween = new TWEEN.Tween(particleSystem.position)
				.to({z: 1750}, 4000)
				.easing(TWEEN.Easing.Linear.None);
			tween.start();
		}
		seq24.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 341000 && !seq24.transition)
			{
				seq24.transition = true;
				setCurrentScene(6);
				TWEEN.removeAll();
				particleSystem.position.z = 1500;
			}
		}

		var seq25 = new Sequence( 343000 );
		seq25.start = function () 
		{
			console.log("start 25");
			seq25.transition = false;
			setCurrentScene(0);
			var tween = new TWEEN.Tween(particleSystem.position)
				.to({z: 2250}, 4000)
				.easing(TWEEN.Easing.Linear.None);
			tween.start();
		}
		seq25.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 347000 && !seq25.transition)
			{
				seq25.transition = true;
				setCurrentScene(6);
				TWEEN.removeAll();
				particleSystem.position.z = 1750;
			}
		}

		var seq26 = new Sequence( 349000 );
		seq26.start = function () 
		{
			console.log("start 26");
			seq26.transition = false;
			setCurrentScene(0);
			var tween = new TWEEN.Tween(particleSystem.position)
				.to({z: 2750}, 4000)
				.easing(TWEEN.Easing.Linear.None);
			tween.start();
		}
		seq26.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 352900 && !seq26.transition)
			{
				seq26.transition = true;
				TWEEN.removeAll();
				particleSystem.position.z = 1250;
				setFade(0x000000, 3500, "out");
			}
		}

		var seq27 = new Sequence( 353000 );
		seq27.start = function () 
		{
			console.log("start 27");
			seq27.transition = false;
			var atween = new TWEEN.Tween(particleSystem.position)
				.to({z: 3500}, 8000)
				.easing(TWEEN.Easing.Circular.In)
				.start();
			var btween = new TWEEN.Tween(particleSystem.material.uniforms.noiseFactor)
				.to({value: 100.0}, 2500)
				.delay(5500)
				.easing(TWEEN.Easing.Linear.None)
				.start();
		}
		seq27.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 361000 && !seq27.transition)
			{
				seq27.transition = true;
				setCurrentScene(6);
				TWEEN.removeAll();
			}
		}

		var seq28 = new Sequence( 362500 );
		seq28.start = function () 
		{
			console.log("start 28");
			seq28.transition = false;
			setCurrentScene(0);
			particleSystem.material.uniforms.noiseFactor.value=5.0;
			destroyDrawing(5000);

		}
		seq28.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 368000 && !seq28.transition)
			{
				seq28.transition = true;
				particleSystem.userData.bRotation = true;
				particleSystem.rotation.y = 0;
				createDrawing(8000, 8000, 0, 0.0);
			}
		}
		var seq29 = new Sequence( 386000 );
		seq29.start = function () 
		{
			console.log("start 29");
			destroyDrawing(5000);
			particleSystem.material.uniforms.activateFlickering.value=0;
			setFade(0x000000, 10000, "in");
		}
		seq29.update = function () 
		{
			renderScene(currentScene);
		}

		var seq30 = new Sequence( 396000 ); 
		seq30.start = function () 
		{
			console.log("start 30");
			seq30.transition = false;
			removeFadePlane();
			resetRenderer();
			setCurrentScene(5);
			setFade(0x000000, 3000, "out");
			robot.rotation.x=Math.PI *0.5-0.1;
			robot.position.x-=30;
			robot.position.y-=10;
			robot.position.z=3902;
			var atween = new TWEEN.Tween(robot.rotation)
				.to({ x: (0)}, 19000)
				.delay(4000)
				.easing(TWEEN.Easing.Linear.None);
			var btween = new TWEEN.Tween(robot.position)
				.to({ y:-80, z:3990}, 22000)
				.delay(7000)
				.easing(TWEEN.Easing.Linear.None);
			var ctween = new TWEEN.Tween(robot.rotation)
				.to({y:-1.0}, 10000)
				.easing(TWEEN.Easing.Linear.None);
			var dtween = new TWEEN.Tween(robot.position)
				.to({ z:3955}, 10000)
				.easing(TWEEN.Easing.Linear.None);
			var etween = new TWEEN.Tween(robot.position)
				.to({ y:80}, 15000)
				.easing(TWEEN.Easing.Cubic.In);
			var ftween = new TWEEN.Tween(robot.position)
				.to({ x:0,y:0,z:3800}, 15000)
				.easing(TWEEN.Easing.Cubic.In);
			var gtween = new TWEEN.Tween(robot.rotation)
				.to({ y: Math.PI*2}, 17000)
				.easing(TWEEN.Easing.Linear.None);
			atween.chain(ctween, dtween);
			dtween.chain(etween);
			etween.chain(ftween, gtween);
			atween.start();
			btween.start();
		}
		seq30.update = function () 
		{
			renderScene(currentScene); 
			if (currentTime > 445000 && currentTime < 451000 && !seq30.transition)
			{
				robot.material.uniforms['envMap'].value = textures.cube2;
				seq30.transition = true;
			}
			else if(currentTime >= 451000 && currentTime < 457000 && seq30.transition){
				robot.material.uniforms['envMap'].value = textures.cube3;
				seq30.transition = false;
			}
			else if(currentTime >= 457000 && !seq30.transition){
				robot.material.uniforms['envMap'].value = textures.cube1;
				setFade(0x000000, 5000, "in");
				seq30.transition = true;

			}
		}

		var seq31 = new Sequence( 462000 );
		seq31.start = function () 
		{
			console.log("start 31");
			removeFadePlane();
			setCurrentScene(0);
			setFlickering(0xffffff, 120, 36);
			createScenesGrid(2,1,false);
			particleSystem.userData.bRotation=false;
			particleSystem.position.y = 15000;
			particleSystem.rotation.y = 0;
			var tween = new TWEEN.Tween(particleSystem.position)
				.to({y: 0}, 3000)
				.delay(1000)
				.easing(TWEEN.Easing.Back.Out)
				.start();

		}
		seq31.update = function () 
		{
			renderVerticalDoubleScene();
		}

		var seq32 = new Sequence( 469000 );
		seq32.start = function () 
		{
			console.log("start 32");
			seq32.transition = false;
			updateParticleSystemCompositions(entrancepoints, machinepoints, 200, 500);
			createDrawing(10000, 10000, 4000, 1.0);
		}
		seq32.update = function () 
		{
			renderVerticalDoubleScene();
			if (currentTime > 490000 && !seq32.transition) 
			{
				seq32.transition = true;
				destroyDrawing(5000);
			}
		}

		var seq33 = new Sequence( 497000 );
		seq33.start = function () 
		{
			console.log("start 33");
			seq33.transition = false;
			resetRenderer();
			createScenesGrid(1,2,false);
			particleSystem.userData.bRotation = true;
			setFlickering(0x000000, 500, 10);
			createDrawing(10000, 10000, 0, 0.0);
		}
		seq33.update = function () 
		{
			renderHorizontalDoubleScene();
			if (currentTime > 519000 && !seq33.transition)
			{
				seq33.transition = true;
				destroyDrawing(5000);
			}
		}

		var seq34 = new Sequence( 526000 ); 
		seq34.start = function () 
		{
			console.log("start 34");
			seq34.transition = false;
			resetRenderer();
			setCurrentScene(4);
			setFade(0xffffff, 1000, "out");
			machine.material.uniforms['amplitude'].value=30.0;
			machine.material.uniforms['animation'].value=1;
			var tween = new TWEEN.Tween(machine.material.uniforms['amplitude'])
				.to({value: 0.0}, 8000)
				.delay(2000)
				.easing(TWEEN.Easing.Back.Out)
				.onComplete(function () {
					machine.material.uniforms['animation'].value=0;
				})
				.start();
		}
		seq34.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 535000 && !seq34.transition) 
			{
				seq34.transition = true;
				setFade(0x000000, 1000, "out");
			}
		}

		var seq35 = new Sequence( 537000 ); 
		seq35.start = function () 
		{
			console.log("start 35");
			seq35.transition = false;
			var atween = new TWEEN.Tween(camera.position)
				.to({y:-70, z: 3850}, 9000)
				.easing(TWEEN.Easing.Quadratic.Out)
				.start();
			var atweenBis = new TWEEN.Tween(camera.rotation)
				.to({x: Math.PI*0.25}, 10000)
				.easing(TWEEN.Easing.Quadratic.In)
				.start();
			var btween = new TWEEN.Tween(camera.position)
				.to({y:0}, 11000)
				.easing(TWEEN.Easing.Quadratic.InOut);
			var btweenBis = new TWEEN.Tween(camera.rotation)
				.to({x: 0}, 8000)
				.easing(TWEEN.Easing.Cubic.In);
			var ctween = new TWEEN.Tween(camera.position)
				.to({z:3785}, 5000)
				.easing(TWEEN.Easing.Quadratic.Out);
			var dtween = new TWEEN.Tween(camera.position)
				.to({y:150, z: 3900}, 8000)
				.easing(TWEEN.Easing.Quadratic.Out);
			var dtweenBis = new TWEEN.Tween(camera.rotation)
				.to({x: -Math.PI*0.4}, 8000)
				.easing(TWEEN.Easing.Quadratic.Out);
			var etween = new TWEEN.Tween(camera.position)
				.to({y:0,z: 4000}, 8000)
				.easing(TWEEN.Easing.Quadratic.InOut);
			var etweenBis = new TWEEN.Tween(camera.rotation)
				.to({x: 0}, 8000)
				.easing(TWEEN.Easing.Quadratic.InOut);
			var movtween = new TWEEN.Tween(machine.material.uniforms['amplitude'])
				.to({value: 1.2}, 1000)
				.delay(250)
				.repeat( 17 )
            	.yoyo( true )
				.easing(TWEEN.Easing.Back.Out)
			var explosiontween = new TWEEN.Tween(machine.material.uniforms['amplitude'])
				.to({value: 30.0}, 5000)
				.delay(1000)
				.onStart(function () {
					machine.material.uniforms['animation'].value=1;
				})
				.easing(TWEEN.Easing.Quadratic.Out);
			atween.chain(btween,movtween);
			atweenBis.chain(btweenBis);
			btweenBis.chain(ctween);
			ctween.chain(dtween,dtweenBis);
			dtween.chain(etween,etweenBis);
			etween.chain(explosiontween);
		}
		seq35.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 581000 && !seq35.transition) 
			{
				seq35.transition = true;
				setFade(0x000000, 1000, "in");
			}
		}

		var seq36 = new Sequence( 588000 );
		seq36.start = function () 
		{
			console.log("start 36");
			TWEEN.removeAll();
			removeFadePlane();
			setCurrentScene(2);
			setFade(0xffffff, 1000, "out");
			buildingsPoints.position.z=-2000;		
			var tween = new TWEEN.Tween(buildingsPoints.position)
					.to({z: 7350}, 40000)
					.delay(2000)
					.easing(TWEEN.Easing.Cubic.Out)
					.start();
		}
		seq36.update = function () 
		{
			renderScene(currentScene);
		}

		var seq37 = new Sequence( 619000 );
		seq37.start = function () 
		{
			console.log("start 37");
			seq37.transition = false;
			setCurrentScene(7);
			setFade(0x000000, 5000, "out");
			setComposer(true);
			var modelIndex=-1;
			if(intervalId != 0)
			{
				clearInterval(intervalId);
				intervalId=0;
			}
			intervalId = setInterval(function(){
				modelIndex+=1;
				if(modelIndex<models.children.length){
					if(modelIndex-1>=0){
						models.children[modelIndex-1].visible=false;
					}		
					models.children[modelIndex].visible=true;
				}
			}, 5000); 
		}
		seq37.update = function () 
		{
			renderScene(currentScene);
			if (currentTime > 673000 && !seq37.transition)
			{
				seq37.transition = true;
				clearInterval(intervalId);
				intervalId=0;
				setFade(0x000000, 3000, "in");
			}
		}


		renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: false, preserveDrawingBuffer: true});
		renderer.setPixelRatio( window.devicePixelRatio ); //to change or comment for high res devices
		renderer.setSize( WIDTH, HEIGHT );
		renderer.autoClearColor = false;
		renderer.setClearColor( 0x000000, 1 );

		window.addEventListener( 'resize', onWindowResize, false );
	}


	function createParticleSystem() {

		var scene = new THREE.Scene();
		scene.name=0;
		
        glow = new THREE.Object3D();
        glow.position.x = 0;
		glow.position.y = 0;
		// particles
		var uniforms = {
			amplitude: { type: "f", value: 0.0 },
			texture:   { type: "t", value: textures.map },
			time:	   { type: "f", value: 0.1 },
			direction: { type: "f", value: 1.0 },
			lightSwitch: { type: "i", value: 0 },
			light: 	   { type: "v3", value: new THREE.Vector3() },
			lightDistance: { type: "f", value: 5000.0 },
			activateFlickering:{ type: "i", value: 0 } ,
			noiseFactor: { type: "f", value: 5.0 } ,
		};

		var shaderMaterial = new THREE.ShaderMaterial( {
			uniforms:       uniforms,
			vertexShader:   document.getElementById( 'vertexshader' ).textContent,
			fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
			blending:       THREE.AdditiveBlending,
			depthTest:      false,
			transparent:    true
		});

		var geometry = new THREE.BufferGeometry();
		var positions = new Float32Array( particles * 3 );
		var sizes = new Float32Array( particles );
		custompositiona = new Float32Array( particles * 3 );
		custompositionb = new Float32Array( particles * 3 );

		for (var i = 0, i3 = 0; i < particles; i ++, i3 += 3) 
		{
			var vector = getRandomPointOnparticles(400+Math.random()*radius*1.5);
			positions[ i3 + 0 ] = vector.x;
			positions[ i3 + 1 ] = vector.y;
			positions[ i3 + 2 ] = vector.z;
		}

		baseSize = [];	
		for( var v = 0; v < particles; v++ ) 
		{
			baseSize[v] = 10+Math.random()*90;
			sizes[v] = baseSize[v];
		}
		geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ));
		geometry.addAttribute( 'size', new THREE.BufferAttribute(sizes,1).setDynamic(true));
		geometry.addAttribute( 'custompositiona', new THREE.BufferAttribute( custompositiona, 3 ).setDynamic(true));
		geometry.addAttribute( 'custompositionb', new THREE.BufferAttribute( custompositionb, 3 ).setDynamic(true));
		particleSystem = new THREE.Points( geometry, shaderMaterial );
		updateParticleSystemCompositions(tabakCentralpoints, towerpoints, 250, 250);
		particleSystem.userData.bRotation = true;
		//SCENE 0
		scene.add(particleSystem);
		scenes.push(scene);
		assetLoaded();
	}


	function updateParticleSystemCompositions(composition1, composition2, scale1, scale2) {
		var l1=composition1.length;
		var l2=composition2.length;
		var vector;
		var index;
		for( var v = 0; v < particles; v++ ) 
		{
			index = v*3;
			if (index > l1) 
			{
				vector = getRandomPointOnparticles(400+Math.random()*radius*1.5);
				custompositiona[ index + 0 ] = vector.x;
				custompositiona[ index + 1 ] = vector.y;
				custompositiona[ index + 2 ] = vector.z;
			} 
			else 
			{
				vector = new THREE.Vector3(composition1[index],composition1[index+1],composition1[index+2]);
				vector.multiplyScalar(scale1);
				custompositiona[ index + 0 ] = vector.x;
				custompositiona[ index + 1 ] = vector.y;
				custompositiona[ index + 2 ] = vector.z;
			}
			if (index > l2) 
			{
				vector = getRandomPointOnparticles(400+Math.random()*radius*1.5);
				custompositionb[ index + 0 ] = vector.x;
				custompositionb[ index + 1 ] = vector.y;
				custompositionb[ index + 2 ] = vector.z;
			} 
			else 
			{
				vector = new THREE.Vector3(composition2[index],composition2[index+1],composition2[index+2]);
				vector.multiplyScalar(scale2);
				custompositionb[ index + 0 ] = vector.x;
				custompositionb[ index + 1 ] = vector.y;
				custompositionb[ index + 2 ] = vector.z;
			}
		}
		particleSystem.geometry.attributes.custompositiona.needsUpdate = true;
		particleSystem.geometry.attributes.custompositionb.needsUpdate = true;
	}

	function animateParticleSystem() {
		glow.position.z = (Math.sin(time*0.002)+0.5) * 3000;

		var sizes = particleSystem.geometry.attributes.size.array;
		for ( var i = 0; i < particles; i++ ) 
		{
			sizes[ i ] = baseSize[i] + baseSize[i] * Math.abs(Math.sin( 0.1 * i + time*0.001 ));
		}
		particleSystem.geometry.attributes.size.needsUpdate = true;
		//noise movimento delle particelle
		particleSystem.material.uniforms.time.value += delta;
		particleSystem.material.uniforms.light.value = glow.position;
		//rotazione delle particelle
		if(particleSystem.userData.bRotation)
		{
			particleSystem.rotation.y = time * 0.0001;
		}
	}

	function createShaders() {
					
   		shadersUniforms = {
   			time: { type: "f", value: 0.1 },
   			iChannel1:  { type: 't', value: textures.iChannel1 },
   			iChannel2:  { type: 't', value: textures.iChannel2 },
   			resolutionImage: { type: "v2", value: new THREE.Vector2()},
   			resolution: { type: "v2", value: new THREE.Vector2() }
    	};

    	shadersUniforms.resolution.value.x = WIDTH;
		shadersUniforms.resolution.value.y = HEIGHT;
		shadersUniforms.resolutionImage.value.x = 200;
		shadersUniforms.resolutionImage.value.y = 112;

		var vertexShaderToy = document.getElementById('vertexShaderToy').textContent;

		var shadersArray = [
			document.getElementById('fragmentShaderInfinitePerlinNoise').textContent,
			document.getElementById('fragmentShaderHorizontalGradient').textContent,
			//document.getElementById('fragmentShaderFractalNoise').textContent,
			document.getElementById('fragmentShaderHash').textContent,
			document.getElementById('fragmentShaderMovingNoise').textContent,
			document.getElementById('fragmentShaderStripesNoise').textContent,
			document.getElementById('fragmentShaderCartesianGrid').textContent,
			document.getElementById('fragmentShaderScanline').textContent
		];

		var planeGeometry = new THREE.PlaneBufferGeometry( 3, 1.5 );
		sceneShaders=[];
		for ( var i =  0, j=shadersArray.length; i < j; i ++ ) 
		{
			var scenetmp = new THREE.Scene();
			var  planeMaterialNoise = new THREE.ShaderMaterial({
          			uniforms : 		 shadersUniforms,
          			vertexShader : 	 vertexShaderToy,
          			fragmentShader : shadersArray[i]
        	});
			var plane = new THREE.Mesh( planeGeometry, planeMaterialNoise );
			plane.position.z = 3999;
			scenetmp.add( plane );
			sceneShaders.push( scenetmp );
		}

		assetLoaded();
	}


	function renderShaders() {

		shadersUniforms.time.value += delta;
		if(scenesPos.length==1)
		{
			renderer.render( sceneShaders[randomIndex], camera );
		}
		else
		{
			renderer.setClearColor( 0x000000 );
			renderer.setScissorTest( false );
			renderer.clear();

			renderer.setClearColor( 0x000000 );
			renderer.setScissorTest( true );
			
			sceneShaders.forEach( function( scenetmp,index ) {
				if(index<scenesPos.length)
				{
					renderer.setViewport( scenesPos[index].left, scenesPos[index].bottom, scenesPos[index].width, scenesPos[index].height);
					renderer.setScissor( scenesPos[index].left, scenesPos[index].bottom, scenesPos[index].width, scenesPos[index].height );
					renderer.render( scenetmp, camera );
				}
			} );
		}
	}


	function renderShader(index) {
		shadersUniforms.time.value += delta;
		renderer.render( sceneShaders[index], camera );

	}


	function createTerrain() {
		var scene = new THREE.Scene();
		scene.name=1;
		scene.fog = new THREE.FogExp2( 0x000000, 0.0005, 30000);

		var worldWidth = 256, worldDepth = 256,
			worldHalfWidth = worldWidth *0.5, worldHalfDepth = worldDepth *0.5;
		var terrainPlaneSize=7500;
		var terrainPlaneHalfSize=terrainPlaneSize*0.5;

		data = generateHeight( worldWidth, worldDepth );
	
				
		var terrainGeometry = new THREE.PlaneBufferGeometry( terrainPlaneSize, terrainPlaneSize, worldWidth - 1, worldDepth - 1 );
		terrainGeometry.rotateX( - Math.PI *0.5 );

		var vertices = terrainGeometry.attributes.position.array;

		var dataTmp=0;
		var heighest=0;
		for ( var i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) 
		{
			dataTmp=data[ i ] * 10;
			vertices[ j + 1 ] = dataTmp;
			if(dataTmp>heighest)
			{
				heighest=dataTmp;
			}
		}
		terrainGeometry.translate(0,-heighest,0);
		terrainGeometry.computeVertexNormals();

		var terrainMaterial = new THREE.ShaderMaterial( {
			uniforms: 		THREE.terrainShader.uniforms,
    		vertexShader:  	THREE.terrainShader.vertexShader,
			fragmentShader: THREE.terrainShader.fragmentShader,
   			wireframe:      true, 
			blending:       THREE.AdditiveBlending,
			depthTest:      false,
			transparent:    true,
			fog:  			true
		} );

		terrain = new THREE.Mesh( terrainGeometry, terrainMaterial );

		//CLOUDS
		var cloudGeometry = new THREE.Geometry();

		var cloudUniforms= {
			activeRay: 	{ type: "i", value: 0},
			map: 		{ type: "t", value: textures.cloud },
			fogColor : 	{ type: "c", value: scene.fog.color },
			fogNear : 	{ type: "f", value: scene.fog.near },
			fogFar : 	{ type: "f", value: scene.fog.far },
			resolution: { type: "v2", value: new THREE.Vector2() }
		};

		var cloudMaterial = new THREE.ShaderMaterial( {
			uniforms: 		cloudUniforms,
			vertexShader: 	document.getElementById( 'cloudVertexShader' ).textContent,
			fragmentShader: document.getElementById( 'cloudFragmentShader' ).textContent,
			depthTest: 		false,
			transparent: 	true,
			side: 			THREE.DoubleSide,
			blending:       THREE.NormalBlending
		} );

		cloudUniforms.resolution.value.x = WIDTH;
		cloudUniforms.resolution.value.y = HEIGHT;

		var plane = new THREE.Mesh( new THREE.PlaneGeometry( 64, 64 ) );
		for ( var i = 0; i < 200; i++ ) 
		{
			plane.position.x = -Math.random() * terrainPlaneSize +(terrainPlaneHalfSize) ;
			plane.position.y = - Math.random() * Math.random()*10.0 + 500 +heighest;
			plane.position.z = -Math.random() * terrainPlaneSize +(terrainPlaneHalfSize) ; 
			//plane.rotation.z = Math.random() * Math.PI;			
			plane.scale.x = plane.scale.y = Math.random() * Math.random()*10.0 + 5.0;
			plane.updateMatrix();
			cloudGeometry.merge(plane.geometry, plane.matrix);
		}
		cloudGeometry.computeVertexNormals();
		clouds = new THREE.Mesh( cloudGeometry, cloudMaterial );
		//SCENE 1
		scene.add(terrain);
		scene.add(clouds);
		scenes.push(scene);

		assetLoaded();
	}


	function animateTerrain() {
		terrain.material.uniforms[ 'time' ].value = .00005 * ( currentTime );
	}


	function createBuildingsPoints(composition1, composition2) {
		//SCENE 2
		var scene = new THREE.Scene();
		scene.name=2;
		scene.fog = new THREE.FogExp2( 0x000000, 0.0005, 35000);

		var composition1Length = composition1.length;
		var buildingsPointsLength = (composition1Length+composition2.length)/3;
		var positions = new Float32Array( buildingsPointsLength * 3 );
		var index;		
		var vector;

		for( var v = 0; v < composition1Length/3; v++ ){
			index = v*3;
			vector = new THREE.Vector3(composition1[index],composition1[index+1],composition1[index+2]);
			vector.multiplyScalar(750);
			vector.applyAxisAngle ( new THREE.Vector3(0.0,1.0,0.0), -Math.PI*0.35);
			positions[ index + 0 ] = vector.x+2250.0;
			positions[ index + 1 ] = vector.y;
			positions[ index + 2 ] = vector.z;

		}
		for( var v = 0; v < composition2.length/3; v++ ){
			index = v*3;
			vector = new THREE.Vector3(composition2[index],composition2[index+1],composition2[index+2]);
			vector.multiplyScalar(500);
			vector.applyAxisAngle ( new THREE.Vector3(0.0,1.0,0.0), Math.PI *0.35);
			positions[ composition1Length + index + 0 ] = vector.x-2150.0;
			positions[ composition1Length + index + 1 ] = vector.y;
			positions[ composition1Length + index + 2 ] = vector.z-300.0;

		}
		
		var buildingsPointSizes = new Float32Array(buildingsPointsLength);
		var buildingsPointsGeometry = new THREE.BufferGeometry();
		buildingsPointsGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ));
		buildingsPointsGeometry.addAttribute( 'size', new THREE.BufferAttribute( buildingsPointSizes, 1 ).setDynamic(true) );

		var buildingsPointsMaterial = new THREE.ShaderMaterial( {
			uniforms: 		THREE.terrainShader.uniforms,
		    vertexShader:  	THREE.terrainShader.vertexShader,
			fragmentShader: THREE.terrainShader.pointsfragmentShader,
			blending:       THREE.AdditiveBlending,
			depthTest:      false,
			transparent:    true,
			fog:  			true
		});
		buildingsPointsMaterial.uniforms['terrainPointsTexture'].value = textures.map;
		buildingsPointsGeometry.computeVertexNormals();
		buildingsPoints = new THREE.Points( buildingsPointsGeometry, buildingsPointsMaterial );

		scene.add(buildingsPoints);
		scenes.push(scene);
		assetLoaded();
	}


	function animateBuildingsPoints() {
		buildingsPoints.material.uniforms[ 'time' ].value = .00005 * ( currentTime );

		var attributeSizes = buildingsPoints.geometry.attributes.size.array;
		for ( var i = 0; i < attributeSizes.length; i++ ) 
		{
			attributeSizes[ i ] = 50+ 25 * Math.abs(Math.sin( 0.1 * i + time* 0.0015 ));
		}
		buildingsPoints.geometry.attributes.size.needsUpdate = true;
	}


	function animateSpaceDistorsion() {
		if(spacePoints.userData.bAnimation)
		{
			spacePoints.rotation.x= space.rotation.x -= delta * 0.0075;
			spacePoints.rotation.y= space.rotation.y += delta * 0.06;
			spacePoints.material.uniforms.delta.value = delta * 0.1;
			spacePoints.material.uniforms.strength.value = Math.sin(Math.exp(Math.cos(time*0.0002)))*80; //110, time*0.00015 for normal space
		
			var attributesSizes = spacePoints.geometry.attributes.size.array;
			for ( var i = 0; i < attributesSizes.length; i++ ) 
			{
				attributesSizes[ i ] = 20+ 5 * Math.sin( 0.1 * i + time* 0.002 ); //time*0.00015 for normal space
			}
			spacePoints.geometry.attributes.size.needsUpdate = true;
		}

	}

	function createPacketDistorsion() {

		var loader = new THREE.JSONLoader();
		loader.load( "models/packetwireframe.js", function( spaceGeometry ) 
		{
		var scene = new THREE.Scene();
		scene.name=3;

		var spaceUniforms = {
				delta:		{ type: "f", value: 0.1 },
				strength:	{ type: "f", value: 0.1 },
				lightNear: 	{ type: "f", value: 0.0 },
				lightFar: 	{ type: "f", value: 4000.0 },
				texture: 	{ type: "t", value: textures.map }
		};

		var spaceMaterial = new THREE.ShaderMaterial( {
				uniforms: 		spaceUniforms,
				vertexShader:   document.getElementById('spaceVertexShader').textContent,
				fragmentShader: document.getElementById('spaceWireFragmentShader').textContent,
				wireframe: 		true,	
				wireframeLinewidth: 2,			
				blending:       THREE.AdditiveBlending,
				depthTest:      false,
				transparent:    true
		});
		spaceGeometry.scale(120,120,120);
		//spaceGeometry.rotateX( Math.PI *0.5);
		var spacePointsVertices = spaceGeometry.vertices;
		var spacePointsVerticesLength = spacePointsVertices.length;
		var spacePointsPositions = new Float32Array( spacePointsVerticesLength * 3 );
		var spacePointSizes = new Float32Array(  spacePointsVerticesLength );
		var spacePointsvertex;
		for ( var i = 0; i <  spacePointsVerticesLength; i ++ ) {
			spacePointsvertex = spacePointsVertices[ i ];
			spacePointsvertex.toArray( spacePointsPositions, i * 3 );
			spacePointSizes[ i ] = 20;
		}


		var spacePointsGeometry = new THREE.BufferGeometry();
		spacePointsGeometry.addAttribute( 'position', new THREE.BufferAttribute( spacePointsPositions, 3 ) );
		spacePointsGeometry.addAttribute( 'size', new THREE.BufferAttribute( spacePointSizes, 1 ).setDynamic(true) );
		var spacePointsMaterial = new THREE.ShaderMaterial( {
			uniforms: 		spaceUniforms,
			vertexShader:   document.getElementById( 'spaceVertexShader' ).textContent,
			fragmentShader: document.getElementById( 'spaceFragmentShader' ).textContent,
			blending:       THREE.AdditiveBlending,
			depthTest:      false,
			transparent:    true
		});

		spacePoints = new THREE.Points( spacePointsGeometry, spacePointsMaterial );
		space = new THREE.Mesh(spaceGeometry, spaceMaterial);
		spacePoints.position.z = 3500;
		space.position.z = 3500;
		spacePoints.userData.bAnimation = false;
		scene.add(spacePoints);
		scene.add(space);
		//SCENE 3
		scenes.push(scene);
		assetLoaded();

		} );
	}

	function createMachine() {
		var loader = new THREE.JSONLoader();
		loader.load( "models/machinewireframe.js", function( tmpGeometry ) 
		{
			var scene = new THREE.Scene();
			scene.name=4;
			var numFaces = tmpGeometry.faces.length;
			tmpGeometry.scale(30,30,30);
			tmpGeometry = new THREE.BufferGeometry().fromGeometry( tmpGeometry );

			var colors = new Float32Array( numFaces * 3 * 3 );
			var displacement = new Float32Array( numFaces * 3 * 3 );
			for ( var f = 0; f < numFaces; f ++ ) {
				var index = 9 * f;
				var c = Math.random()*1.1;
				var d = 10 * ( 0.5 - Math.random() );
				for ( var i = 0; i < 3; i ++ ) {
					colors[ index + ( 3 * i )     ] = c;
					colors[ index + ( 3 * i ) + 1 ] = c;
					colors[ index + ( 3 * i ) + 2 ] = c;
					displacement[ index + ( 3 * i )     ] = d;
					displacement[ index + ( 3 * i ) + 1 ] = d;
					displacement[ index + ( 3 * i ) + 2 ] = d;
				}
			}
			tmpGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
			tmpGeometry.addAttribute( 'displacement', new THREE.BufferAttribute( displacement, 3 ) );

			var machineMaterial = new THREE.ShaderMaterial( {
				uniforms: 		THREE.TessellationShader.uniforms,
				vertexShader:  	THREE.TessellationShader.vertexShader,
				fragmentShader: THREE.TessellationShader.fragmentShader,
				lights: 		true
			});
			machineMaterial.uniforms['diffuse'].value = new THREE.Color(0x000000);

			machine = new THREE.Mesh( tmpGeometry, machineMaterial );
			machine.position.z= 3800;
			scene.add( machine );

		    machine.userData.light1 = new THREE.PointLight(0xffffff,0.7);
		    machine.userData.light1.position.set(0,-60,3875);
		    scene.add(machine.userData.light1);
		    
		    machine.userData.light2 = new THREE.PointLight(0xffffff,0.7,150.0,2.0);
		    scene.add(machine.userData.light2);

		    machine.userData.light3 = new THREE.PointLight(0xffffff,0.7,250.0,2.0);
		    scene.add(machine.userData.light3);
		   	//SCENE 4
			scenes.push(scene);
			assetLoaded();
		});
	}

	function animateMachine() {
		if(machine.material.uniforms['animation'].value==0)
		{
			machine.userData.light1.position.x = Math.sin(0.00065*time) * 70;

			machine.userData.light2.position.x = Math.cos(time*0.001) * 20+20;
			machine.userData.light2.position.y = Math.abs(Math.sin(0.0003*time)) * 75-20;
			machine.userData.light2.position.z = 3840+Math.sin(0.0006*time) * 10;

			machine.userData.light3.position.x = Math.cos(time*0.0005) * 40+20;
			machine.userData.light3.position.y = Math.abs(Math.sin(0.0006*time)) * 80-35;
			machine.userData.light3.position.z = 3840+Math.sin(0.0003*time) * 20;
		}
	}


	function createRobot() {
		var loader = new THREE.JSONLoader();
		loader.load( "models/robotwireframe.js", function( tmpGeometry ) 
		{
			var scene = new THREE.Scene();
			scene.name=5;
			var robotUniforms = {
		        color: {type: "c",value: new THREE.Color(0x333333)},
		        envMap: {type: "t",value: textures.cube1},
		        globalTime:   {type: "f",value: 0.1},
		        fresnelBias: {type: "f",value: 0.5},
		        fresnelScale: {type: "f",value: 5.0},
		        fresnelPower: {type: 'f',value: 1.0}
	    	};
	 		var robotMaterial = new THREE.ShaderMaterial({
	 			uniforms : robotUniforms,
	            vertexShader : document.getElementById('robotVertexShader').text,
	            fragmentShader : document.getElementById('robotFragmentShader').text,
	          	blending:       THREE.AdditiveBlending,
				depthTest:      false,
				transparent:    true,
				fog:  			true
	        });
	        tmpGeometry.scale(70,70,70);
	    	robot = new THREE.Mesh(tmpGeometry, robotMaterial);
	    	robot.position.z=3800;
	    	scene.add(robot);
	    	//SCENE 5
			scenes.push(scene);
			assetLoaded();
		});
	}

	function animateRobot() {
		robot.material.uniforms['globalTime'].value += delta*2;
	}

	function createBlackEmptyScene() {
		var scene = new THREE.Scene();
		scene.name=6;
		//SCENE 6
		scenes.push(scene);
		assetLoaded();
	}


	function createModels() {
		var modelsFiles=["aeswireframe.js","entrancewireframe.js", "entranceexternewireframe.js", "machinewireframe.js", "mainbuildingwireframe.js", "packetwireframe.js", "robotwireframe.js", "tabakCentralwireframe.js", "towerwireframe.js", "trainwireframe.js"];
		var modelsPath="models/";
		var pathTmp;
		var modelsMaterial = new THREE.MeshBasicMaterial( {wireframe: true, transparent: true } );
		var loader;
		var scene = new THREE.Scene();
		scene.name=7;
		models= new THREE.Object3D();
		for (var i=0; i<modelsFiles.length; i++)
		{
			loader = new THREE.JSONLoader();
			pathTmp = modelsPath+modelsFiles[i];
			loader.load( pathTmp, function( tmpGeometry ) 
			{
				tmpGeometry.scale(650,650,650);
				var modelMesh = new THREE.Mesh( tmpGeometry, modelsMaterial );
				modelMesh.visible=false;
				models.add(modelMesh);
			} );
		}
		//SCENE 7
		scene.add( models );
		models.userData.bRotation=true;
		scenes.push( scene );
		assetLoaded();
	}

	function animateModels() {
		if(models.userData.bRotation){
			for (var i=0; i <models.children.length; i++){
				if(models.children[i].visible){
					models.children[i].rotation.y = time * 0.00025;
				}
			}
		}
	}


	function getRandomPointOnparticles(r) {
		var angle = Math.random() * Math.PI * 2;
		var u = Math.random() * 2 - 1;	
		var v = new THREE.Vector3(
			Math.cos(angle) * Math.sqrt(1 - Math.pow(u, 2)) * r,
			Math.sin(angle) * Math.sqrt(1 - Math.pow(u, 2)) * r,
			u * r
		);
		return v;
	}

	function createDrawing(timer, timeZoom, particlesPos, direction) {
		particleSystem.material.uniforms.direction.value = direction;
		//creating drawing
		var atween = new TWEEN.Tween(particleSystem.material.uniforms.amplitude)
			.to({value: 1}, timer)
			.easing(TWEEN.Easing.Back.InOut);
		//zoom
		var btween = new TWEEN.Tween(particleSystem.position)
			.to({z: particlesPos}, timeZoom)
			.delay(1000)
			.easing(TWEEN.Easing.Linear.None)
			.onStart(function () {particleSystem.material.uniforms.lightSwitch.value=1;});
		atween.chain(btween);

		atween.start();
	}

	function destroyDrawing(timer) {
		//destroying drawing
		var tweenDestroy = new TWEEN.Tween(particleSystem.material.uniforms.amplitude)
			.to({value: 0}, timer)
			.easing(TWEEN.Easing.Back.InOut)
			//stop pulsing light
			.onStart(function () {particleSystem.material.uniforms.lightSwitch.value=0;});
		tweenDestroy.start();
	}

	function generateHeight( width, height ) {

		var size = width * height, data = new Uint8Array( size ),
		perlin = new ImprovedNoise(), quality = 1, z = Math.random() * 100;
		for ( var j = 0; j < 4; j ++ ) {
			for ( var i = 0; i < size; i ++ ) {
				var x = i % width, y = ~~ ( i / width );
				data[ i ] += Math.abs( perlin.noise( x / quality, y / quality, z ) * quality *0.85 );
			}
			quality *= 5;
		}
		return data;
	}

	function resetRenderer() {
		TWEEN.removeAll();
		if(intervalId != 0)
		{
			clearInterval(intervalId);
			intervalId=0;
		}
		
		while (container.firstChild) 
		{
    		container.removeChild(container.firstChild);
		}

		renderer.setViewport( 0, 0, WIDTH, HEIGHT);
		renderer.setScissor( 0, 0, WIDTH, HEIGHT );
		renderer.setClearColor( 0x000000, 1 );
		renderer.autoClearColor = false;
	}
				

	var onWindowResize= function () {
		WIDTH = window.innerWidth;
		HEIGHT = window.innerHeight;

		camera.aspect = WIDTH / HEIGHT;
		camera.updateProjectionMatrix();
		renderer.setSize( WIDTH, HEIGHT );
		if(composer)
		{
			composer.reset();
			composer.setSize(WIDTH, HEIGHT);
		}
		if(clouds)
		{
			clouds.material.uniforms.resolution.value.x = WIDTH;
			clouds.material.uniforms.resolution.value.y = HEIGHT;
		}
			
	}


	var animate = function () {
		requestAnimationFrame( animate );
		if(isPlaying){
			render();
		}
	}

	function renderScene(sceneIndex) {
		switch (sceneIndex) {
			case 0:
			    animateParticleSystem();
			    break;
			case 1:
			    animateTerrain();
			    break;
			case 2:
			    animateBuildingsPoints();
			    break;
			case 3:
			    animateSpaceDistorsion();
			    break;
			case 4:
			    animateMachine();
			    break;
			case 5:
			    animateRobot();
			    break;
			case 6:
			    break;
			case 7:
				animateModels();
			    break;

		}
		if(bComposer)
		{
			composer.render(0.01);
		}
		else
		{
			if(!bTrails)
			{
				renderer.clear();
			}
			renderer.render( scenes[sceneIndex], camera );
		} 
	}

	function renderScenes() {
		if(scenesPos.length==1)
		{
			renderScene(randomIndex);
		}
		else
		{
			renderer.setClearColor( 0x000000 );
			renderer.setScissorTest( false );
			renderer.clear();

			renderer.setClearColor( 0x000000 );
			renderer.setScissorTest( true );
			animateParticleSystem();
			animateTerrain();
			animateBuildingsPoints();
			animateSpaceDistorsion();
			animateRobot();
			animateMachine();
			animateModels();
			scenes.forEach( function( scene, index ) 
			{
				if(index<scenesPos.length)
				{
					renderer.setViewport( scenesPos[index].left, scenesPos[index].bottom, scenesPos[index].width, scenesPos[index].height);
					renderer.setScissor( scenesPos[index].left, scenesPos[index].bottom, scenesPos[index].width, scenesPos[index].height );

					renderer.render( scene, camera );
				}
			} );
		}
	}

	function renderVerticalDoubleScene() {
		switch (currentScene) {
			case 0:
			    animateParticleSystem();
			    break;
			case 1:
			    animateTerrain();
			    break;
			case 2:
			    animateBuildingsPoints();
			    break;
			case 3:
			    animateSpaceDistorsion();
			    break;
			case 4:
			    animateMachine();
			    break;
			case 5:
			    animateRobot();
			    break;
			case 6:
			    break;
			case 7:
				animateModels();
			    break;

		}
		renderer.setClearColor( 0x000000 );
		renderer.setScissorTest( false );
		renderer.clear();

		renderer.setClearColor( 0x000000 );
		renderer.setScissorTest( true );

		renderer.setViewport( scenesPos[0].left, scenesPos[0].bottom+scenesPos[0].height*0.25, scenesPos[0].width, scenesPos[0].height*0.5);
		renderer.setScissor( scenesPos[0].left, scenesPos[0].bottom+scenesPos[0].height*0.25, scenesPos[0].width, scenesPos[0].height*0.5 );
		renderer.render( scenes[currentScene], camera );

		renderer.setViewport( scenesPos[1].left, scenesPos[1].bottom+scenesPos[1].height*0.25, scenesPos[1].width, scenesPos[1].height*0.5);
		renderer.setScissor( scenesPos[1].left, scenesPos[1].bottom+scenesPos[1].height*0.25, scenesPos[1].width, scenesPos[1].height*0.5 );
		renderer.render( scenes[currentScene], camera );

	}

	function renderHorizontalDoubleScene() {
		switch (currentScene) {
			case 0:
			    animateParticleSystem();
			    break;
			case 1:
			    animateTerrain();
			    break;
			case 2:
			    animateBuildingsPoints();
			    break;
			case 3:
			    animateSpaceDistorsion();
			    break;
			case 4:
			    animateMachine();
			    break;
			case 5:
			    animateRobot();
			    break;
			case 6:
			    break;
			case 7:
				animateModels();
			    break;

		}
		renderer.setClearColor( 0x000000 );
		renderer.setScissorTest( false );
		renderer.clear();

		renderer.setClearColor( 0x000000 );
		renderer.setScissorTest( true );

		renderer.setViewport( scenesPos[0].left+scenesPos[0].width*0.25, scenesPos[0].bottom, scenesPos[0].width*0.5, scenesPos[0].height );
		renderer.setScissor( scenesPos[0].left+scenesPos[0].width*0.25, scenesPos[0].bottom, scenesPos[0].width*0.5, scenesPos[0].height );
		renderer.render( scenes[currentScene], camera );

		renderer.setViewport( scenesPos[1].left+scenesPos[1].width*0.25, scenesPos[1].bottom, scenesPos[1].width*0.5, scenesPos[1].height );
		renderer.setScissor( scenesPos[1].left+scenesPos[1].width*0.25, scenesPos[1].bottom, scenesPos[1].width*0.5, scenesPos[1].height );
		renderer.render( scenes[currentScene], camera );

	}

	var render = function () {
		time = Date.now();
		currentTime = getTime();
		delta=clock.getDelta();
		if (isNaN(delta) || delta > 1 || delta == 0 ) {
			delta = 1/60;
		}
		TWEEN.update(window.performance.now()-timedelta);	
		runSequences();

		//if( capturer ) capturer.capture( renderer.domElement );	
	}

	var sequenceList = [];
	var runSequences = function () {
		// run current item
		sequenceList[0].update();
		sequenceList[0].currentTime = currentTime - sequenceList[0].startTime;
		if (sequenceList.length <= 1) 
		{
			return;
		}
		var nextSequence = sequenceList[1];
		if (currentTime >= nextSequence.startTime) {
			// switch item
			var currentSequence = sequenceList[0];
			currentSequence.end();
			nextSequence.start();
			nextSequence.update();
			sequenceList.splice(0, 1);
		}
	}

	function Sequence( time ) {
		this.startTime = time;
		this.currentTime = 0;
		this.start = function () {
		}
		this.update = function () {
		}
		this.end = function () {	
		}
		sequenceList.push(this);
	}

	function createScenesGrid(cols, rows, border) {			
		var template = document.getElementById( "template" ).textContent;
		var container = document.getElementById( "container" );
		var tileWidth  = Math.floor(WIDTH / cols);
    	var tileHeight = Math.floor(HEIGHT/ rows);
    	if(border){
    		tileWidth -= 4;
    		tileHeight-= 4;
    	}
    	if(shadersUniforms)
    	{
	    	shadersUniforms.resolution.value.x = tileWidth;
			shadersUniforms.resolution.value.y = tileHeight;
    	}
    	if(clouds)
		{
			clouds.material.uniforms.resolution.value.x = tileWidth;
			clouds.material.uniforms.resolution.value.y = tileHeight;
		}
		scenesPos=[];
		while (container.firstChild) 
		{
    		container.removeChild(container.firstChild);
		}
		for ( var i =  0, totalIndex= cols*rows; i < totalIndex; i ++ ) 
		{	
			var element = document.createElement( "div" );
				element.className = "list-item";
				element.innerHTML = template.replace( '$', i +1);
			container.appendChild( element );
			var div= element.querySelector( ".scene" );
			div.style.width = tileWidth+'px';
			div.style.height = tileHeight+'px';
			if(border)
			{
				div.style.border="2px solid white";
			}
			var rect = div.getBoundingClientRect();
			var rectLeft   = rect.left;
			var rectBottom = HEIGHT - rect.bottom;
			if(border)
			{
    			rectLeft   += 2;
    			rectBottom += 2;
    		}
			if(rectBottom<0)
			{
				rectBottom=0;
			}
			var posScene = {
    			width  : tileWidth,
   				height : tileHeight,
   				left   : rectLeft,
    			bottom : rectBottom
    		};
			scenesPos.push(posScene);
		}
	}

	function createRandomIndex(timer, max) {
		randomIndex=0;
		if(intervalId != 0)
		{
			clearInterval(intervalId);
			intervalId=0;
		}
		intervalId = setInterval(function(){ setRandomIndex(0,(max-1)); }, timer);
	}

	function createRandomScenesPos(timer) {
		if(intervalId != 0)
		{
			clearInterval(intervalId);
			intervalId=0;
		}
		intervalId= setInterval(function(){ shuffle(scenesPos); }, timer);
	}


	function shuffle(array) {
		var currentIndex = array.length, temporaryValue, randomIndex;

		 // While there remain elements to shuffle...
		while (0 !== currentIndex) {

			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

		    // And swap it with the current element.
			temporaryValue = array[currentIndex];
		    array[currentIndex] = array[randomIndex];
		    array[randomIndex] = temporaryValue;
		}
	}

	function setRandomIndex(min, max) {
    	randomIndex = Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function setCurrentScene(sceneIndex) {
    	currentScene=sceneIndex;
	}

	function setComposer(value) {
    	if(renderer){
    		bComposer=value;
	   		if(bComposer){
	   			//the postprocessing doesn't work for the first sequence because the composer has not been yet created :-(
	   			renderer.setClearColor( 0x707070, 1);
	   			renderer.autoClearColor = true;
				composer = new THREE.EffectComposer( renderer );
				composer.addPass( new THREE.RenderPass( scenes[currentScene], camera ) );
				var shaderVignette = THREE.VignetteShader;
				var effectVignette = new THREE.ShaderPass( shaderVignette );
				effectVignette.uniforms[ "offset" ].value = 0.75;
				effectVignette.uniforms[ "darkness" ].value = 1.5;
				composer.addPass( effectVignette );
				var effectFilm = new THREE.FilmPass( 0.9, 0.0, 2048, true );
				effectFilm.renderToScreen = true;
				composer.addPass( effectFilm );
	   		}
	   		else{
	   			renderer.setClearColor( 0x000000, 1 );
	   			renderer.autoClearColor = false;
	   		}
    	}
	}

	function addTrails() {
    	bTrails=true;
		scenes[currentScene].add(planeTrails);
	}

	function removeTrails() {
    	bTrails=false;
		scenes[currentScene].remove(planeTrails);
	}

	function setFlickering(color, freq, times) {
			
		fadePlane.material.color.setHex(color);
		fadePlane.material.opacity = 0.0;
		scenes[currentScene].add(fadePlane);

		var fadeTween = new TWEEN.Tween( fadePlane.material )
            .to( { opacity: 1.0 }, freq )
            .repeat( times+1 )
            .yoyo( true )
            .easing( TWEEN.Easing.Linear.None )
            .onComplete(function () {scenes[currentScene].remove(fadePlane);})
    		.start();
	}

	function setFade(color, freq, direction) {
		fadePlane.material.color.setHex(color);
		scenes[currentScene].add(fadePlane);
		var fadeTween;
    	switch (direction) {
			case "in":
				fadePlane.material.opacity=0.0;
				fadeTween = new TWEEN.Tween( fadePlane.material )
          		  .to( { opacity: 1.0 }, freq )
          		  .easing( TWEEN.Easing.Linear.None );
			    break;
			case "out":
				fadePlane.material.opacity=1.0;
				fadeTween = new TWEEN.Tween( fadePlane.material )
          		  .to( { opacity: 0.0 }, freq )
          		  .easing( TWEEN.Easing.Linear.None )
          		  .onComplete(function () {scenes[currentScene].remove(fadePlane);});
			    break;
		}
		fadeTween.start();
	}

	function removeFadePlane() {
		scenes[currentScene].remove(fadePlane);
	}


	return tabak;
})();