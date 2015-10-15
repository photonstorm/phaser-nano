# Phaser Nano

Phaser is a fast, free and fun open source HTML5 game framework used by thousands of developers worldwide. It uses [Pixi.js](https://github.com/GoodBoyDigital/pixi.js/) for WebGL and Canvas rendering across desktop and mobile web browsers.

Phaser Nano is a highly optimized and bare minimum version of its parent framework. Designed specifically for super low file size environments such as banner ads and interstitials, yet still extremely powerful and flexible. It retains the same approach towards ease-of-use that makes Phaser so popular.

## Features

* Only 8.3KB (min/gz) / 28KB (min)
* WebGL Renderer with Sprite Batch support
* Canvas Renderer
* Asset Loader inc. parallel download streams
* Asset Cache
* Texture Atlas support (JSON Array and JSON Hash formats supported)
* Texture Crop support
* Texture Frame support
* Global FrameData (Sprites share Frame references, cutting down massively on animation / atlas overhead)
* Sprites with Position, Scale, Anchor, Rotation and Pivot
* Sprite Sheet support (fixed frame)
* Sprite Alpha
* Per vertex Sprite tint
* WebGL Blend Modes: ADD, MULTIPLY and SCREEN
* Pixel Art mode support
* Geometry (Point, Rectangle, Matrix)
* Texture Blitting (render textures directly without needing Sprites)
* Groups (pool and recycle objects in a Group, unlike Phaser they are no longer display related)
* Layers (a Group that lives on the Display List with its own transform and can have children)
* Game World root object
* Game Object Factory for quick creation of Sprites, Layers and Groups

## TODO

* Canvas Blend Modes
* Bitmap Text support with texture in atlas
* Multi-atlas support
* Rotated atlas frame support
* Tweens (bare minimum build)
* Delta Timer
* Input support (maybe Mouse / Pointer only)
* Loader callbacks (for progress events)
* Investigate bare minimum physics implementation (and keep optional)
* Game background color
* Texture.fromCanvas (then can use it for basic Text support)
* buildSheet ought to move to FrameData (or Loader?)
* Remove duplicate updateTransform code from Layer and Sprite

![div](http://www.phaser.io/images/github/div.png)

* **Visit:** The [Phaser website](http://phaser.io) and follow on [Twitter](https://twitter.com/photonstorm) (#phaserjs)
* **Be awesome:** Support the future of Phaser on [Patreon](https://www.patreon.com/photonstorm) or by buying our [books](http://phaser.io/shop/books) and [plugins](http://phaser.io/shop/plugins)
