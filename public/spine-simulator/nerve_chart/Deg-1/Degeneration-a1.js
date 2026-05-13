(function (cjs, an) {

var p; // shortcut to reference prototypes
var lib={};var ss={};var img={};
lib.ssMetadata = [
		{name:"Degeneration_a1_atlas_", frames: [[0,0,220,396],[444,398,220,396],[222,796,220,396],[222,0,220,396],[444,0,220,396],[0,796,220,396],[666,0,220,396],[0,398,220,396],[666,398,220,396],[222,398,220,396],[444,796,220,396]]}
];


// symbols:



(lib.Bitmap1 = function() {
	this.spriteSheet = ss["Degeneration_a1_atlas_"];
	this.gotoAndStop(0);
}).prototype = p = new cjs.Sprite();



(lib.Bitmap11 = function() {
	this.spriteSheet = ss["Degeneration_a1_atlas_"];
	this.gotoAndStop(1);
}).prototype = p = new cjs.Sprite();



(lib.Bitmap13 = function() {
	this.spriteSheet = ss["Degeneration_a1_atlas_"];
	this.gotoAndStop(2);
}).prototype = p = new cjs.Sprite();



(lib.Bitmap14 = function() {
	this.spriteSheet = ss["Degeneration_a1_atlas_"];
	this.gotoAndStop(3);
}).prototype = p = new cjs.Sprite();



(lib.Bitmap15 = function() {
	this.spriteSheet = ss["Degeneration_a1_atlas_"];
	this.gotoAndStop(4);
}).prototype = p = new cjs.Sprite();



(lib.Bitmap16 = function() {
	this.spriteSheet = ss["Degeneration_a1_atlas_"];
	this.gotoAndStop(5);
}).prototype = p = new cjs.Sprite();



(lib.Bitmap17 = function() {
	this.spriteSheet = ss["Degeneration_a1_atlas_"];
	this.gotoAndStop(6);
}).prototype = p = new cjs.Sprite();



(lib.Bitmap18 = function() {
	this.spriteSheet = ss["Degeneration_a1_atlas_"];
	this.gotoAndStop(7);
}).prototype = p = new cjs.Sprite();



(lib.Bitmap19 = function() {
	this.spriteSheet = ss["Degeneration_a1_atlas_"];
	this.gotoAndStop(8);
}).prototype = p = new cjs.Sprite();



(lib.Bitmap20 = function() {
	this.spriteSheet = ss["Degeneration_a1_atlas_"];
	this.gotoAndStop(9);
}).prototype = p = new cjs.Sprite();



(lib.Bitmap9 = function() {
	this.spriteSheet = ss["Degeneration_a1_atlas_"];
	this.gotoAndStop(10);
}).prototype = p = new cjs.Sprite();



// stage content:
(lib.Degenerationa1 = function(mode,startPosition,loop) {
	this.initialize(mode,startPosition,loop,{});

	// timeline functions:
	this.frame_52 = function() {
		/* Stop at This Frame
		The  timeline will stop/pause at the frame where you insert this code.
		Can also be used to stop/pause the timeline of movieclips.
		*/
		
		this.stop();
	}

	// actions tween:
	this.timeline.addTween(cjs.Tween.get(this).wait(52).call(this.frame_52).wait(1));

	// Layer 21 copy
	this.instance = new lib.Bitmap17();
	this.instance.parent = this;

	this.instance_1 = new lib.Bitmap18();
	this.instance_1.parent = this;

	this.instance_2 = new lib.Bitmap19();
	this.instance_2.parent = this;

	this.instance_3 = new lib.Bitmap20();
	this.instance_3.parent = this;

	this.timeline.addTween(cjs.Tween.get({}).to({state:[]}).to({state:[{t:this.instance}]},40).to({state:[{t:this.instance_1}]},3).to({state:[{t:this.instance_2}]},4).to({state:[{t:this.instance_3}]},3).wait(3));

	// Layer 21
	this.instance_4 = new lib.Bitmap1();
	this.instance_4.parent = this;

	this.instance_5 = new lib.Bitmap9();
	this.instance_5.parent = this;

	this.instance_6 = new lib.Bitmap11();
	this.instance_6.parent = this;

	this.instance_7 = new lib.Bitmap13();
	this.instance_7.parent = this;

	this.instance_8 = new lib.Bitmap14();
	this.instance_8.parent = this;

	this.instance_9 = new lib.Bitmap15();
	this.instance_9.parent = this;

	this.instance_10 = new lib.Bitmap16();
	this.instance_10.parent = this;

	this.instance_11 = new lib.Bitmap17();
	this.instance_11.parent = this;

	this.instance_12 = new lib.Bitmap18();
	this.instance_12.parent = this;

	this.instance_13 = new lib.Bitmap19();
	this.instance_13.parent = this;

	this.instance_14 = new lib.Bitmap20();
	this.instance_14.parent = this;

	this.timeline.addTween(cjs.Tween.get({}).to({state:[{t:this.instance_4}]}).to({state:[{t:this.instance_5}]},9).to({state:[{t:this.instance_6}]},3).to({state:[{t:this.instance_7}]},3).to({state:[{t:this.instance_8}]},3).to({state:[{t:this.instance_9}]},4).to({state:[{t:this.instance_10}]},3).to({state:[{t:this.instance_11}]},3).to({state:[{t:this.instance_12}]},3).to({state:[{t:this.instance_13}]},4).to({state:[{t:this.instance_14}]},3).to({state:[]},3).wait(12));

}).prototype = p = new cjs.MovieClip();
p.nominalBounds = new cjs.Rectangle(110,198,220,396);
// library properties:
lib.properties = {
	id: '6ACDB0603C70AA43BDF7C44581C533E5',
	width: 220,
	height: 396,
	fps: 24,
	color: "#FFFFFF",
	opacity: 1.00,
	manifest: [
		{src:"images/Degeneration_a1_atlas_.png", id:"Degeneration_a1_atlas_"}
	],
	preloads: []
};



// bootstrap callback support:

(lib.Stage = function(canvas) {
	createjs.Stage.call(this, canvas);
}).prototype = p = new createjs.Stage();

p.setAutoPlay = function(autoPlay) {
	this.tickEnabled = autoPlay;
}
p.play = function() { this.tickEnabled = true; this.getChildAt(0).gotoAndPlay(this.getTimelinePosition()) }
p.stop = function(ms) { if(ms) this.seek(ms); this.tickEnabled = false; }
p.seek = function(ms) { this.tickEnabled = true; this.getChildAt(0).gotoAndStop(lib.properties.fps * ms / 1000); }
p.getDuration = function() { return this.getChildAt(0).totalFrames / lib.properties.fps * 1000; }

p.getTimelinePosition = function() { return this.getChildAt(0).currentFrame / lib.properties.fps * 1000; }

an.bootcompsLoaded = an.bootcompsLoaded || [];
if(!an.bootstrapListeners) {
	an.bootstrapListeners=[];
}

an.bootstrapCallback=function(fnCallback) {
	an.bootstrapListeners.push(fnCallback);
	if(an.bootcompsLoaded.length > 0) {
		for(var i=0; i<an.bootcompsLoaded.length; ++i) {
			fnCallback(an.bootcompsLoaded[i]);
		}
	}
};

an.compositions = an.compositions || {};
an.compositions['6ACDB0603C70AA43BDF7C44581C533E5'] = {
	getStage: function() { return exportRoot.getStage(); },
	getLibrary: function() { return lib; },
	getSpriteSheet: function() { return ss; },
	getImages: function() { return img; }
};

an.compositionLoaded = function(id) {
	an.bootcompsLoaded.push(id);
	for(var j=0; j<an.bootstrapListeners.length; j++) {
		an.bootstrapListeners[j](id);
	}
}

an.getComposition = function(id) {
	return an.compositions[id];
}



})(createjs = createjs||{}, AdobeAn = AdobeAn||{});
var createjs, AdobeAn;