(function(){/**
 * A simple event system. Allows you to hook into Kontra lifecycle events or create your own, such as for [Plugins](api/plugin).
 *
 * ```js
 * import { on, off, emit } from 'kontra';
 *
 * function callback(a, b, c) {
 *   console.log({a, b, c});
 * });
 *
 * on('myEvent', callback);
 * emit('myEvent', 1, 2, 3);  //=> {a: 1, b: 2, c: 3}
 * off('myEvent', callback);
 * ```
 * @sectionName Events
 */

// expose for testing
let callbacks = {};

/**
 * Call all callback functions for the event. All arguments will be passed to the callback functions.
 * @function emit
 *
 * @param {String} event - Name of the event.
 * @param {...*} args - Comma separated list of arguments passed to all callbacks.
 */
function emit(event, ...args) {
  (callbacks[event] || []).map(fn => fn(...args));
}

/**
 * Functions for initializing the Kontra library and getting the canvas and context
 * objects.
 *
 * ```js
 * import { getCanvas, getContext, init } from 'kontra';
 *
 * let { canvas, context } = init();
 *
 * // or can get canvas and context through functions
 * canvas = getCanvas();
 * context = getContext();
 * ```
 * @sectionName Core
 */

let canvasEl, context;

/**
 * Return the canvas element.
 * @function getCanvas
 *
 * @returns {HTMLCanvasElement} The canvas element for the game.
 */
function getCanvas() {
  return canvasEl;
}

/**
 * Return the context object.
 * @function getContext
 *
 * @returns {CanvasRenderingContext2D} The context object the game draws to.
 */
function getContext() {
  return context;
}

/**
 * Initialize the library and set up the canvas. Typically you will call `init()` as the first thing and give it the canvas to use. This will allow all Kontra objects to reference the canvas when created.
 *
 * ```js
 * import { init } from 'kontra';
 *
 * let { canvas, context } = init('game');
 * ```
 * @function init
 *
 * @param {String|HTMLCanvasElement} [canvas] - The canvas for Kontra to use. Can either be the ID of the canvas element or the canvas element itself. Defaults to using the first canvas element on the page.
 *
 * @returns {{canvas: HTMLCanvasElement, context: CanvasRenderingContext2D}} An object with properties `canvas` and `context`. `canvas` it the canvas element for the game and `context` is the context object the game draws to.
 */
function init(canvas) {

  // check if canvas is a string first, an element next, or default to getting
  // first canvas on page
  canvasEl = document.getElementById(canvas) ||
             canvas ||
             document.querySelector('canvas');

  // @ifdef DEBUG
  if (!canvasEl) {
    throw Error('You must provide a canvas element for the game');
  }
  // @endif

  context = canvasEl.getContext('2d');
  context.imageSmoothingEnabled = false;

  emit('init');

  return { canvas: canvasEl, context };
}

// noop function
const noop = () => {};

// get world x, y, width, and height of object
function getWorldRect(obj) {
  let world = obj.world || obj;

  let x = world.x;
  let y = world.y;
  let width = world.width;
  let height = world.height;

  // @ifdef GAMEOBJECT_ANCHOR
  // take into account object anchor
  if (obj.anchor) {
    x -= width * obj.anchor.x;
    y -= height * obj.anchor.y;
  }
  // @endif

  return {
    x,
    y,
    width,
    height
  };
}

/**
 * Rotate a point by an angle.
 * @function rotatePoint
 *
 * @param {{x: Number, y: Number}} point - The point to rotate.
 * @param {Number} angle - Angle (in radians) to rotate.
 *
 * @returns {{x: Number, y: Number}} The new x and y coordinates after rotation.
 */
function rotatePoint(point, angle) {
  let sin = Math.sin(angle);
  let cos = Math.cos(angle);
  let x = point.x * cos - point.y * sin;
  let y = point.x * sin + point.y * cos;

  return {x, y};
}

/**
 * Clamp a number between two values, preventing it from going below or above the minimum and maximum values.
 * @function clamp
 *
 * @param {Number} min - Min value.
 * @param {Number} max - Max value.
 * @param {Number} value - Value to clamp.
 *
 * @returns {Number} Value clamped between min and max.
 */
function clamp(min, max, value) {
  return Math.min( Math.max(min, value), max );
}

/**
 * A simple 2d vector object.
 *
 * ```js
 * import { Vector } from 'kontra';
 *
 * let vector = Vector(100, 200);
 * ```
 * @class Vector
 *
 * @param {Number} [x=0] - X coordinate of the vector.
 * @param {Number} [y=0] - Y coordinate of the vector.
 */
class Vector {
  constructor(x = 0, y = 0, vec = {}) {
    this.x = x;
    this.y = y;

    // @ifdef VECTOR_CLAMP
    // preserve vector clamping when creating new vectors
    if (vec._c) {
      this.clamp(vec._a, vec._b, vec._d, vec._e);

      // reset x and y so clamping takes effect
      this.x = x;
      this.y = y;
    }
    // @endif
  }

  /**
   * Calculate the addition of the current vector with the given vector.
   * @memberof Vector
   * @function add
   *
   * @param {Vector|{x: number, y: number}} vector - Vector to add to the current Vector.
   *
   * @returns {Vector} A new Vector instance whose value is the addition of the two vectors.
   */
  add(vec) {
    return new Vector(
      this.x + vec.x,
      this.y + vec.y,
      this
    );
  }

  // @ifdef VECTOR_SUBTRACT
  /**
   * Calculate the subtraction of the current vector with the given vector.
   * @memberof Vector
   * @function subtract
   *
   * @param {Vector|{x: number, y: number}} vector - Vector to subtract from the current Vector.
   *
   * @returns {Vector} A new Vector instance whose value is the subtraction of the two vectors.
   */
   subtract(vec) {
    return new Vector(
      this.x - vec.x,
      this.y - vec.y,
      this
    );
  }
  // @endif

  // @ifdef VECTOR_SCALE
  /**
   * Calculate the multiple of the current vector by a value.
   * @memberof Vector
   * @function scale
   *
   * @param {Number} value - Value to scale the current Vector.
   *
   * @returns {Vector} A new Vector instance whose value is multiplied by the scalar.
   */
  scale(value) {
    return new Vector(
      this.x * value,
      this.y * value
    );
  }
  // @endif

  // @ifdef VECTOR_NORMALIZE
  /**
   * Calculate the normalized value of the current vector. Requires the Vector [length](/api/vector#length) function.
   * @memberof Vector
   * @function normalize
   *
   * @returns {Vector} A new Vector instance whose value is the normalized vector.
   */
  // @see https://github.com/jed/140bytes/wiki/Byte-saving-techniques#use-placeholder-arguments-instead-of-var
  normalize(length = this.length()) {
    return new Vector(
      this.x / length,
      this.y / length
    );
  }
  // @endif

  // @ifdef VECTOR_DOT||VECTOR_ANGLE
  /**
   * Calculate the dot product of the current vector with the given vector.
   * @memberof Vector
   * @function dot
   *
   * @param {Vector|{x: number, y: number}} vector - Vector to dot product against.
   *
   * @returns {Number} The dot product of the vectors.
   */
  dot(vec) {
    return this.x * vec.x + this.y * vec.y;
  }
  // @endif

  // @ifdef VECTOR_LENGTH||VECTOR_NORMALIZE||VECTOR_ANGLE
  /**
   * Calculate the length (magnitude) of the Vector.
   * @memberof Vector
   * @function length
   *
   * @returns {Number} The length of the vector.
   */
  length() {
    return Math.hypot(this.x, this.y);
  }
  // @endif

  // @ifdef VECTOR_DISTANCE
  /**
   * Calculate the distance between the current vector and the given vector.
   * @memberof Vector
   * @function distance
   *
   * @param {Vector|{x: number, y: number}} vector - Vector to calculate the distance between.
   *
   * @returns {Number} The distance between the two vectors.
   */
  distance(vec) {
    return Math.hypot(this.x - vec.x, this.y - vec.y);
  }
  // @endif

  // @ifdef VECTOR_ANGLE
  /**
   * Calculate the angle (in radians) between the current vector and the given vector. Requires the Vector [dot](/api/vector#dot) and [length](/api/vector#length) functions.
   * @memberof Vector
   * @function angle
   *
   * @param {Vector} vector - Vector to calculate the angle between.
   *
   * @returns {Number} The angle (in radians) between the two vectors.
   */
  angle(vec) {
    return Math.acos(this.dot(vec) / (this.length() * vec.length()));
  }
  // @endif

  // @ifdef VECTOR_CLAMP
  /**
   * Clamp the Vector between two points, preventing `x` and `y` from going below or above the minimum and maximum values. Perfect for keeping a sprite from going outside the game boundaries.
   *
   * ```js
   * import { Vector } from 'kontra';
   *
   * let vector = Vector(100, 200);
   * vector.clamp(0, 0, 200, 300);
   *
   * vector.x += 200;
   * console.log(vector.x);  //=> 200
   *
   * vector.y -= 300;
   * console.log(vector.y);  //=> 0
   *
   * vector.add({x: -500, y: 500});
   * console.log(vector);    //=> {x: 0, y: 300}
   * ```
   * @memberof Vector
   * @function clamp
   *
   * @param {Number} xMin - Minimum x value.
   * @param {Number} yMin - Minimum y value.
   * @param {Number} xMax - Maximum x value.
   * @param {Number} yMax - Maximum y value.
   */
  clamp(xMin, yMin, xMax, yMax) {
    this._c = true;
    this._a = xMin;
    this._b = yMin;
    this._d = xMax;
    this._e = yMax;
  }

  /**
   * X coordinate of the vector.
   * @memberof Vector
   * @property {Number} x
   */
  get x() {
    return this._x;
  }

  /**
   * Y coordinate of the vector.
   * @memberof Vector
   * @property {Number} y
   */
  get y() {
    return this._y;
  }

  set x(value) {
    this._x = (this._c ? clamp(this._a, this._d, value) : value);
  }

  set y(value) {
    this._y = (this._c ? clamp(this._b, this._e, value) : value);
  }
  // @endif
}

function factory$1() {
  return new Vector(...arguments);
}
factory$1.prototype = Vector.prototype;
factory$1.class = Vector;

/**
 * This is a private class that is used just to help make the GameObject class more manageable and smaller.
 *
 * It maintains everything that can be changed in the update function:
 * position
 * velocity
 * acceleration
 * ttl
 */
class Updatable {

  constructor(properties) {
    return this.init(properties);
  }

  init(properties = {}) {

    // --------------------------------------------------
    // defaults
    // --------------------------------------------------

    /**
     * The game objects position vector. Represents the local position of the object as opposed to the [world](/api/gameObject#world) position.
     * @property {Vector} position
     * @memberof GameObject
     * @page GameObject
     */
    this.position = factory$1();

    // --------------------------------------------------
    // optionals
    // --------------------------------------------------

    // @ifdef GAMEOBJECT_VELOCITY
    /**
     * The game objects velocity vector.
     * @memberof GameObject
     * @property {Vector} velocity
     * @page GameObject
     */
    this.velocity = factory$1();
    // @endif

    // @ifdef GAMEOBJECT_ACCELERATION
    /**
     * The game objects acceleration vector.
     * @memberof GameObject
     * @property {Vector} acceleration
     * @page GameObject
     */
    this.acceleration = factory$1();
    // @endif

    // @ifdef GAMEOBJECT_TTL
    /**
     * How may frames the game object should be alive.
     * @memberof GameObject
     * @property {Number} ttl
     * @page GameObject
     */
    this.ttl = Infinity;
    // @endif

    // add all properties to the object, overriding any defaults
    Object.assign(this, properties);
  }

  /**
   * Update the game objects position based on its velocity and acceleration. Calls the game objects [advance()](api/gameObject#advance) function.
   * @memberof GameObject
   * @function update
   * @page GameObject
   *
   * @param {Number} [dt] - Time since last update.
   */
  update(dt) {
    this.advance(dt);
  }

  /**
   * Move the game object by its acceleration and velocity. If you pass `dt` it will multiply the vector and acceleration by that number. This means the `dx`, `dy`, `ddx` and `ddy` should be the how far you want the object to move in 1 second rather than in 1 frame.
   *
   * If you override the game objects [update()](api/gameObject#update) function with your own update function, you can call this function to move the game object normally.
   *
   * ```js
   * import { GameObject } from 'kontra';
   *
   * let gameObject = GameObject({
   *   x: 100,
   *   y: 200,
   *   width: 20,
   *   height: 40,
   *   dx: 5,
   *   dy: 2,
   *   update: function() {
   *     // move the game object normally
   *     this.advance();
   *
   *     // change the velocity at the edges of the canvas
   *     if (this.x < 0 ||
   *         this.x + this.width > this.context.canvas.width) {
   *       this.dx = -this.dx;
   *     }
   *     if (this.y < 0 ||
   *         this.y + this.height > this.context.canvas.height) {
   *       this.dy = -this.dy;
   *     }
   *   }
   * });
   * ```
   * @memberof GameObject
   * @function advance
   * @page GameObject
   *
   * @param {Number} [dt] - Time since last update.
   *
   */
  advance(dt) {
    // @ifdef GAMEOBJECT_VELOCITY
    // @ifdef GAMEOBJECT_ACCELERATION
    let acceleration = this.acceleration;

    // @ifdef VECTOR_SCALE
    if (dt) {
      acceleration = acceleration.scale(dt);
    }
    // @endif

    this.velocity = this.velocity.add(acceleration);
    // @endif
    // @endif

    // @ifdef GAMEOBJECT_VELOCITY
    let velocity = this.velocity;

    // @ifdef VECTOR_SCALE
    if (dt) {
      velocity = velocity.scale(dt);
    }
    // @endif

    this.position = this.position.add(velocity);
    this._pc();
    // @endif

    // @ifdef GAMEOBJECT_TTL
    this.ttl--;
    // @endif
  }

  // --------------------------------------------------
  // velocity
  // --------------------------------------------------

  // @ifdef GAMEOBJECT_VELOCITY
  /**
   * X coordinate of the velocity vector.
   * @memberof GameObject
   * @property {Number} dx
   * @page GameObject
   */
  get dx() {
    return this.velocity.x;
  }

  /**
   * Y coordinate of the velocity vector.
   * @memberof GameObject
   * @property {Number} dy
   * @page GameObject
   */
  get dy() {
    return this.velocity.y;
  }

  set dx(value) {
    this.velocity.x = value;
  }

  set dy(value) {
    this.velocity.y = value;
  }
  // @endif

  // --------------------------------------------------
  // acceleration
  // --------------------------------------------------

  // @ifdef GAMEOBJECT_ACCELERATION
  /**
   * X coordinate of the acceleration vector.
   * @memberof GameObject
   * @property {Number} ddx
   * @page GameObject
   */
  get ddx() {
    return this.acceleration.x;
  }

  /**
   * Y coordinate of the acceleration vector.
   * @memberof GameObject
   * @property {Number} ddy
   * @page GameObject
   */
  get ddy() {
    return this.acceleration.y;
  }

  set ddx(value) {
    this.acceleration.x = value;
  }

  set ddy(value) {
    this.acceleration.y = value;
  }
  // @endif

  // --------------------------------------------------
  // ttl
  // --------------------------------------------------

  // @ifdef GAMEOBJECT_TTL
  /**
   * Check if the game object is alive.
   * @memberof GameObject
   * @function isAlive
   * @page GameObject
   *
   * @returns {Boolean} `true` if the game objects [ttl](api/gameObject#ttl) property is above `0`, `false` otherwise.
   */
  isAlive() {
    return this.ttl > 0;
  }
  // @endif

  _pc() {}
}

/**
 * The base class of most renderable classes. Handles things such as position, rotation, anchor, and the update and render life cycle.
 *
 * Typically you don't create a GameObject directly, but rather extend it for new classes.
 * @class GameObject
 *
 * @param {Object} [properties] - Properties of the game object.
 * @param {Number} [properties.x] - X coordinate of the position vector.
 * @param {Number} [properties.y] - Y coordinate of the position vector.
 * @param {Number} [properties.width] - Width of the game object.
 * @param {Number} [properties.height] - Height of the game object.
 *
 * @param {CanvasRenderingContext2D} [properties.context] - The context the game object should draw to. Defaults to [core.getContext()](api/core#getContext).
 *
 * @param {Number} [properties.dx] - X coordinate of the velocity vector.
 * @param {Number} [properties.dy] - Y coordinate of the velocity vector.
 * @param {Number} [properties.ddx] - X coordinate of the acceleration vector.
 * @param {Number} [properties.ddy] - Y coordinate of the acceleration vector.
 * @param {Number} [properties.ttl=Infinity] - How many frames the game object should be alive. Used by [Pool](api/pool).
 *
 * @param {{x: number, y: number}} [properties.anchor={x:0,y:0}] - The x and y origin of the game object. {x:0, y:0} is the top left corner of the game object, {x:1, y:1} is the bottom right corner.
 * @param {Number} [properties.sx=0] - The x camera position.
 * @param {Number} [properties.sy=0] - The y camera position.
 * @param {GameObject[]} [properties.children] - Children to add to the game object.
 * @param {Number} [properties.opacity=1] - The opacity of the game object.
 * @param {Number} [properties.rotation=0] - The rotation around the anchor in radians.
 * @param {Number} [properties.scaleX=1] - The x scale of the game object.
 * @param {Number} [properties.scaleY=1] - The y scale of the game object.
 *
 * @param {(dt?: number) => void} [properties.update] - Function called every frame to update the game object.
 * @param {Function} [properties.render] - Function called every frame to render the game object.
 *
 * @param {...*} properties.props - Any additional properties you need added to the game object. For example, if you pass `gameObject({type: 'player'})` then the game object will also have a property of the same name and value. You can pass as many additional properties as you want.
 */
class GameObject extends Updatable {
  /**
   * @docs docs/api_docs/gameObject.js
   */

  /**
   * Use this function to reinitialize a game object. It takes the same properties object as the constructor. Useful it you want to repurpose a game object.
   * @memberof GameObject
   * @function init
   *
   * @param {Object} properties - Properties of the game object.
   */
  init({

    // --------------------------------------------------
    // defaults
    // --------------------------------------------------

    /**
     * The width of the game object. Represents the local width of the object as opposed to the [world](/api/gameObject#world) width.
     * @memberof GameObject
     * @property {Number} width
     */
    width = 0,

    /**
     * The height of the game object. Represents the local height of the object as opposed to the [world](/api/gameObject#world) height.
     * @memberof GameObject
     * @property {Number} height
     */
    height = 0,

    /**
     * The context the game object will draw to.
     * @memberof GameObject
     * @property {CanvasRenderingContext2D} context
     */
    context = getContext(),

    render = this.draw,
    update = this.advance,

    // --------------------------------------------------
    // optionals
    // --------------------------------------------------

    // @ifdef GAMEOBJECT_GROUP
    /**
     * The game objects parent object.
     * @memberof GameObject
     * @property {GameObject|null} parent
     */

    /**
     * The game objects children objects.
     * @memberof GameObject
     * @property {GameObject[]} children
     */
    children = [],
    // @endif

    // @ifdef GAMEOBJECT_ANCHOR
    /**
     * The x and y origin of the game object. {x:0, y:0} is the top left corner of the game object, {x:1, y:1} is the bottom right corner.
     * @memberof GameObject
     * @property {{x: number, y: number}} anchor
     *
     * @example
     * // exclude-code:start
     * let { GameObject } = kontra;
     * // exclude-code:end
     * // exclude-script:start
     * import { GameObject } from 'kontra';
     * // exclude-script:end
     *
     * let gameObject = GameObject({
     *   x: 150,
     *   y: 100,
     *   width: 50,
     *   height: 50,
     *   color: 'red',
     *   // exclude-code:start
     *   context: context,
     *   // exclude-code:end
     *   render: function() {
     *     this.context.fillStyle = this.color;
     *     this.context.fillRect(0, 0, this.height, this.width);
     *   }
     * });
     *
     * function drawOrigin(gameObject) {
     *   gameObject.context.fillStyle = 'yellow';
     *   gameObject.context.beginPath();
     *   gameObject.context.arc(gameObject.x, gameObject.y, 3, 0, 2*Math.PI);
     *   gameObject.context.fill();
     * }
     *
     * gameObject.render();
     * drawOrigin(gameObject);
     *
     * gameObject.anchor = {x: 0.5, y: 0.5};
     * gameObject.x = 300;
     * gameObject.render();
     * drawOrigin(gameObject);
     *
     * gameObject.anchor = {x: 1, y: 1};
     * gameObject.x = 450;
     * gameObject.render();
     * drawOrigin(gameObject);
     */
    anchor = {x: 0, y: 0},
    // @endif

    // @ifdef GAMEOBJECT_CAMERA
    /**
     * The X coordinate of the camera.
     * @memberof GameObject
     * @property {Number} sx
     */
    sx = 0,

    /**
     * The Y coordinate of the camera.
     * @memberof GameObject
     * @property {Number} sy
     */
    sy = 0,
    // @endif

    // @ifdef GAMEOBJECT_OPACITY
    /**
     * The opacity of the object. Represents the local opacity of the object as opposed to the [world](/api/gameObject#world) opacity.
     * @memberof GameObject
     * @property {Number} opacity
     */
    opacity = 1,
    // @endif

    // @ifdef GAMEOBJECT_ROTATION
    /**
     * The rotation of the game object around the anchor in radians. . Represents the local rotation of the object as opposed to the [world](/api/gameObject#world) rotation.
     * @memberof GameObject
     * @property {Number} rotation
     */
    rotation = 0,
    // @endif

    // @ifdef GAMEOBJECT_SCALE
    /**
     * The x scale of the object. Represents the local x scale of the object as opposed to the [world](/api/gameObject#world) x scale.
     * @memberof GameObject
     * @property {Number} scaleX
     */
    scaleX = 1,

    /**
     * The y scale of the object. Represents the local y scale of the object as opposed to the [world](/api/gameObject#world) y scale.
     * @memberof GameObject
     * @property {Number} scaleY
     */
    scaleY = 1,
    // @endif

    ...props
  } = {}) {

    // @ifdef GAMEOBJECT_GROUP
    this.children = [];
    // @endif

    // by setting defaults to the parameters and passing them into
    // the init, we can ensure that a parent class can set overriding
    // defaults and the GameObject won't undo it (if we set
    // `this.width` then no parent could provide a default value for
    // width)
    super.init({
      width,
      height,
      context,

      // @ifdef GAMEOBJECT_ANCHOR
      anchor,
      // @endif

      // @ifdef GAMEOBJECT_CAMERA
      sx,
      sy,
      // @endif

      // @ifdef GAMEOBJECT_OPACITY
      opacity,
      // @endif

      // @ifdef GAMEOBJECT_ROTATION
      rotation,
      // @endif

      // @ifdef GAMEOBJECT_SCALE
      scaleX,
      scaleY,
      // @endif

      ...props
    });

    // di = done init
    this._di = true;
    this._uw();

    // @ifdef GAMEOBJECT_GROUP
    children.map(child => this.addChild(child));
    // @endif

    // rf = render function
    this._rf = render;

    // uf = update function
    this._uf = update;
  }

  /**
   * Render the game object. Calls the game objects [draw()](api/gameObject#draw) function.
   * @memberof GameObject
   * @function render
   *
   * @param {Function} [filterObjects] - [Array.prototype.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) function which is used to filter which children to render.
   */
  render(filterObjects) {
    let context = this.context;
    context.save();

    // 1) translate to position
    //
    // it's faster to only translate if one of the values is non-zero
    // rather than always translating
    // @see https://jsperf.com/translate-or-if-statement/2
    if (this.x || this.y) {
      context.translate(this.x, this.y);
    }

    // @ifdef GAMEOBJECT_ROTATION
    // 2) rotate around the anchor
    //
    // it's faster to only rotate when set rather than always rotating
    // @see https://jsperf.com/rotate-or-if-statement/2
    if (this.rotation) {
      context.rotate(this.rotation);
    }
    // @endif

    // @ifdef GAMEOBJECT_CAMERA
    // 3) translate to the camera position after rotation so camera
    // values are in the direction of the rotation rather than always
    // along the x/y axis
    if (this.sx || this.sy) {
      context.translate(-this.sx, -this.sy);
    }
    // @endif

    // @ifdef GAMEOBJECT_SCALE
    // 4) scale after translation to position so object can be
    // scaled in place (rather than scaling position as well).
    //
    // it's faster to only scale if one of the values is not 1
    // rather than always scaling
    // @see https://jsperf.com/scale-or-if-statement/4
    if (this.scaleX != 1 || this.scaleY != 1) {
      context.scale(this.scaleX, this.scaleY);
    }
    // @endif

    // @ifdef GAMEOBJECT_ANCHOR
    // 5) translate to the anchor so (0,0) is the top left corner
    // for the render function
    let anchorX = -this.width * this.anchor.x;
    let anchorY = -this.height * this.anchor.y;

    if (anchorX || anchorY) {
      context.translate(anchorX, anchorY);
    }
    // @endif

    // @ifdef GAMEOBJECT_OPACITY
    // it's not really any faster to gate the global alpha
    // @see https://jsperf.com/global-alpha-or-if-statement/1
    this.context.globalAlpha = this.opacity;
    // @endif

    this._rf();

    // @ifdef GAMEOBJECT_ANCHOR
    // 7) translate back to the anchor so children use the correct
    // x/y value from the anchor
    if (anchorX || anchorY) {
      context.translate(-anchorX, -anchorY);
    }
    // @endif

    // @ifdef GAMEOBJECT_GROUP
    // perform all transforms on the parent before rendering the children
    let children = this.children;
    if (filterObjects) {
      children = children.filter(filterObjects);
    }
    children.map(child => child.render && child.render());
    // @endif

    context.restore();
  }

  /**
   * Draw the game object at its X and Y position, taking into account rotation, scale, and anchor.
   *
   * Do note that the canvas has been rotated and translated to the objects position (taking into account anchor), so {0,0} will be the top-left corner of the game object when drawing.
   *
   * If you override the game objects `render()` function with your own render function, you can call this function to draw the game object normally.
   *
   * ```js
   * let { GameObject } = kontra;
   *
   * let gameObject = GameObject({
   *  x: 290,
   *  y: 80,
   *  width: 20,
   *  height: 40,
   *
   *  render: function() {
   *    // draw the game object normally (perform rotation and other transforms)
   *    this.draw();
   *
   *    // outline the game object
   *    this.context.strokeStyle = 'yellow';
   *    this.context.lineWidth = 2;
   *    this.context.strokeRect(0, 0, this.width, this.height);
   *  }
   * });
   *
   * gameObject.render();
   * ```
   * @memberof GameObject
   * @function draw
   */
  draw() {}

  /**
   * Sync property changes from the parent to the child
   */
  _pc(prop, value) {
    this._uw();

    // @ifdef GAMEOBJECT_GROUP
    this.children.map(child => child._pc());
    // @endif
  }

  /**
   * X coordinate of the position vector.
   * @memberof GameObject
   * @property {Number} x
   */
  get x() {
    return this.position.x;
  }

  /**
   * Y coordinate of the position vector.
   * @memberof GameObject
   * @property {Number} y
   */
  get y() {
    return this.position.y;
  }

  set x(value) {
    this.position.x = value;

    // pc = property changed
    this._pc();
  }

  set y(value) {
    this.position.y = value;
    this._pc();
  }

  get width() {
    // w = width
    return this._w;
  }

  set width(value) {
    this._w = value;
    this._pc();
  }

  get height() {
    // h = height
    return this._h;
  }

  set height(value) {
    this._h = value;
    this._pc();
  }

  /**
   * Update world properties
   */
  _uw() {
    // don't update world properties until after the init has finished
    if (!this._di) return;

    // @ifdef GAMEOBJECT_GROUP||GAMEOBJECT_OPACITY||GAMEOBJECT_ROTATION||GAMEOBJECT_SCALE
    let {
      _wx = 0,
      _wy = 0,

      // @ifdef GAMEOBJECT_OPACITY
      _wo = 1,
      // @endif

      // @ifdef GAMEOBJECT_ROTATION
      _wr = 0,
      // @endif

      // @ifdef GAMEOBJECT_SCALE
      _wsx = 1,
      _wsy = 1
      // @endif
    } = (this.parent || {});
    // @endif

    // wx = world x, wy = world y
    this._wx = this.x;
    this._wy = this.y;

    // ww = world width, wh = world height
    this._ww = this.width;
    this._wh = this.height;

    // @ifdef GAMEOBJECT_OPACITY
    // wo = world opacity
    this._wo = _wo * this.opacity;
    // @endif

    // @ifdef GAMEOBJECT_ROTATION
    // wr = world rotation
    this._wr = _wr + this.rotation;

    let {x, y} = rotatePoint({x: this.x, y: this.y}, _wr);
    this._wx = x;
    this._wy = y;
    // @endif

    // @ifdef GAMEOBJECT_SCALE
    // wsx = world scale x, wsy = world scale y
    this._wsx = _wsx * this.scaleX;
    this._wsy = _wsy * this.scaleY;

    this._wx = this.x * _wsx;
    this._wy = this.y * _wsy;
    this._ww = this.width * this._wsx;
    this._wh = this.height * this._wsy;
    // @endif

    // @ifdef GAMEOBJECT_GROUP
    this._wx += _wx;
    this._wy += _wy;
    // @endif
  }

  /**
   * The world position, width, height, opacity, rotation, and scale. The world property is the true position, width, height, etc. of the object, taking into account all parents.
   * @property {{x: number, y: number, width: number, height: number, opacity: number, rotation: number, scaleX: number, scaleY: number}} world
   * @memberof GameObject
   */
  get world() {
    return {
      x: this._wx,
      y: this._wy,
      width: this._ww,
      height: this._wh,

      // @ifdef GAMEOBJECT_OPACITY
      opacity: this._wo,
      // @endif

      // @ifdef GAMEOBJECT_ROTATION
      rotation: this._wr,
      // @endif

      // @ifdef GAMEOBJECT_SCALE
      scaleX: this._wsx,
      scaleY: this._wsy
      // @endif
    }
  }

  // --------------------------------------------------
  // group
  // --------------------------------------------------

  // @ifdef GAMEOBJECT_GROUP
  /**
   * Add an object as a child to this object. The childs [world](/api/gameObject#world) property will be updated to take into account this object and all of its parents.
   * @memberof GameObject
   * @function addChild
   *
   * @param {GameObject} child - Object to add as a child.
   *
   * @example
   * // exclude-code:start
   * let { GameObject } = kontra;
   * // exclude-code:end
   * // exclude-script:start
   * import { GameObject } from 'kontra';
   * // exclude-script:end
   *
   * function createObject(x, y, color, size = 1) {
   *   return GameObject({
   *     x,
   *     y,
   *     width: 50 / size,
   *     height: 50 / size,
   *     anchor: {x: 0.5, y: 0.5},
   *     color,
   *     // exclude-code:start
   *     context: context,
   *     // exclude-code:end
   *     render: function() {
   *       this.context.fillStyle = this.color;
   *       this.context.fillRect(0, 0, this.height, this.width);
   *     }
   *   });
   * }
   *
   * let parent = createObject(300, 100, 'red');
   * let child = createObject(25, 25, 'yellow', 2);
   *
   * parent.addChild(child);
   *
   * parent.render();
   */
  addChild(child, { absolute = false } = {}) {
    this.children.push(child);
    child.parent = this;
    child._pc = child._pc || noop;
    child._pc();
  }

  /**
   * Remove an object as a child of this object. The removed objects [world](/api/gameObject#world) property will be updated to not take into account this object and all of its parents.
   * @memberof GameObject
   * @function removeChild
   *
   * @param {GameObject} child - Object to remove as a child.
   */
  removeChild(child) {
    let index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.parent = null;
      child._pc();
    }
  }

  /**
   * Update all children
   */
  update(dt) {
    this._uf(dt);

    this.children.map(child => child.update && child.update());
  }
  // @endif

  // --------------------------------------------------
  // opacity
  // --------------------------------------------------

  // @ifdef GAMEOBJECT_OPACITY
  get opacity() {
    return this._opa;
  }

  set opacity(value) {
    this._opa = value;
    this._pc();
  }
  // @endif

  // --------------------------------------------------
  // rotation
  // --------------------------------------------------

  // @ifdef GAMEOBJECT_ROTATION
  get rotation() {
    return this._rot;
  }

  set rotation(value) {
    this._rot = value;
    this._pc();
  }
  // @endif

  // --------------------------------------------------
  // scale
  // --------------------------------------------------

  // @ifdef GAMEOBJECT_SCALE
  /**
   * Set the x and y scale of the object. If only one value is passed, both are set to the same value.
   * @memberof GameObject
   * @function setScale
   *
   * @param {Number} x - X scale value.
   * @param {Number} [y=x] - Y scale value.
   */
  setScale(x, y = x) {
    this.scaleX = x;
    this.scaleY = y;
  }

  get scaleX() {
    return this._scx;
  }

  set scaleX(value) {
    this._scx = value;
    this._pc();
  }

  get scaleY() {
    return this._scy;
  }

  set scaleY(value) {
    this._scy = value;
    this._pc();
  }
  // @endif
}

function factory$2() {
  return new GameObject(...arguments);
}
factory$2.prototype = GameObject.prototype;
factory$2.class = GameObject;

/**
 * A versatile way to update and draw your sprites. It can handle simple rectangles, images, and sprite sheet animations. It can be used for your main player object as well as tiny particles in a particle engine.
 * @class Sprite
 * @extends GameObject
 *
 * @param {Object} [properties] - Properties of the sprite.
 * @param {String} [properties.color] - Fill color for the game object if no image or animation is provided.
 * @param {HTMLImageElement|HTMLCanvasElement} [properties.image] - Use an image to draw the sprite.
 * @param {Object} [properties.animations] - An object of [Animations](api/animation) from a [Spritesheet](api/spriteSheet) to animate the sprite.
 */
class Sprite extends factory$2.class {
  /**
   * @docs docs/api_docs/sprite.js
   */

  init({
    /**
     * The color of the game object if it was passed as an argument.
     * @memberof Sprite
     * @property {String} color
     */

    // @ifdef SPRITE_IMAGE
    /**
     * The image the sprite will use when drawn if passed as an argument.
     * @memberof Sprite
     * @property {HTMLImageElement|HTMLCanvasElement} image
     */
    image,

    /**
     * The width of the sprite. If the sprite is a [rectangle sprite](api/sprite#rectangle-sprite), it uses the passed in value. For an [image sprite](api/sprite#image-sprite) it is the width of the image. And for an [animation sprite](api/sprite#animation-sprite) it is the width of a single frame of the animation.
     * @memberof Sprite
     * @property {Number} width
     */
    width = image ? image.width : undefined,

    /**
     * The height of the sprite. If the sprite is a [rectangle sprite](api/sprite#rectangle-sprite), it uses the passed in value. For an [image sprite](api/sprite#image-sprite) it is the height of the image. And for an [animation sprite](api/sprite#animation-sprite) it is the height of a single frame of the animation.
     * @memberof Sprite
     * @property {Number} height
     */
    height = image ? image.height : undefined,
    // @endif

    ...props
  } = {}) {
    super.init({
      // @ifdef SPRITE_IMAGE
      image,
      width,
      height,
      // @endif
      ...props
    });
  }

  // @ifdef SPRITE_ANIMATION
  /**
   * An object of [Animations](api/animation) from a [SpriteSheet](api/spriteSheet) to animate the sprite. Each animation is named so that it can can be used by name for the sprites [playAnimation()](api/sprite#playAnimation) function.
   *
   * ```js
   * import { Sprite, SpriteSheet } from 'kontra';
   *
   * let spriteSheet = SpriteSheet({
   *   // ...
   *   animations: {
   *     idle: {
   *       frames: 1,
   *       loop: false,
   *     },
   *     walk: {
   *       frames: [1,2,3]
   *     }
   *   }
   * });
   *
   * let sprite = Sprite({
   *   x: 100,
   *   y: 200,
   *   animations: spriteSheet.animations
   * });
   *
   * sprite.playAnimation('idle');
   * ```
   * @memberof Sprite
   * @property {Object} animations
   */
  get animations() {
    return this._a;
  }

  set animations(value) {
    let prop, firstAnimation;
    // a = animations
    this._a = {};

    // clone each animation so no sprite shares an animation
    for (prop in value) {
      this._a[prop] = value[prop].clone();

      // default the current animation to the first one in the list
      firstAnimation = firstAnimation || this._a[prop];
    }

    /**
     * The currently playing Animation object if `animations` was passed as an argument.
     * @memberof Sprite
     * @property {Animation} currentAnimation
     */
    this.currentAnimation = firstAnimation;
    this.width = this.width || firstAnimation.width;
    this.height = this.height || firstAnimation.height;
  }

  /**
   * Set the currently playing animation of an animation sprite.
   *
   * ```js
   * import { Sprite, SpriteSheet } from 'kontra';
   *
   * let spriteSheet = SpriteSheet({
   *   // ...
   *   animations: {
   *     idle: {
   *       frames: 1
   *     },
   *     walk: {
   *       frames: [1,2,3]
   *     }
   *   }
   * });
   *
   * let sprite = Sprite({
   *   x: 100,
   *   y: 200,
   *   animations: spriteSheet.animations
   * });
   *
   * sprite.playAnimation('idle');
   * ```
   * @memberof Sprite
   * @function playAnimation
   *
   * @param {String} name - Name of the animation to play.
   */
  playAnimation(name) {
    this.currentAnimation = this.animations[name];

    if (!this.currentAnimation.loop) {
      this.currentAnimation.reset();
    }
  }

  advance(dt) {
    super.advance(dt);

    if (this.currentAnimation) {
      this.currentAnimation.update(dt);
    }
  }
  // @endif

  draw() {
    // @ifdef SPRITE_IMAGE
    if (this.image) {
      this.context.drawImage(
        this.image,
        0, 0, this.image.width, this.image.height
      );
    }
    // @endif

    // @ifdef SPRITE_ANIMATION
    if (this.currentAnimation) {
      this.currentAnimation.render({
        x: 0,
        y: 0,
        width: this.width,
        height: this.height,
        context: this.context
      });
    }
    // @endif

    if (this.color) {
      this.context.fillStyle = this.color;
      this.context.fillRect(0, 0, this.width, this.height);
    }
  }
}

function factory$3() {
  return new Sprite(...arguments);
}
factory$3.prototype = Sprite.prototype;
factory$3.class = Sprite;

let fontSizeRegex = /(\d+)(\w+)/;

function parseFont(font) {
  let match = font.match(fontSizeRegex);

  // coerce string to number
  // @see https://github.com/jed/140bytes/wiki/Byte-saving-techniques#coercion-to-test-for-types
  let size = +match[1];
  let unit = match[2];
  let computed = size;

  // compute font size
  // switch(unit) {
  //   // px defaults to the size

  //   // em uses the size of the canvas when declared (but won't keep in sync with
  //   // changes to the canvas font-size)
  //   case 'em': {
  //     let fontSize = window.getComputedStyle(getCanvas()).fontSize;
  //     let parsedSize = parseFont(fontSize).size;
  //     computed = size * parsedSize;
  //   }

  //   // rem uses the size of the HTML element when declared (but won't keep in
  //   // sync with changes to the HTML element font-size)
  //   case 'rem': {
  //     let fontSize = window.getComputedStyle(document.documentElement).fontSize;
  //     let parsedSize = parseFont(fontSize).size;
  //     computed = size * parsedSize;
  //   }
  // }

  return {
    size,
    unit,
    computed
  };
}

/**
 * An object for drawing text to the screen. Supports newline characters as well as automatic new lines when setting the `width` property.
 *
 * You can also display RTL languages by setting the attribute `dir="rtl"` on the main canvas element. Due to the limited browser support for individual text to have RTL settings, it must be set globally for the entire game.
 *
 * @example
 * // exclude-code:start
 * let { Text } = kontra;
 * // exclude-code:end
 * // exclude-script:start
 * import { Text } from 'kontra';
 * // exclude-script:end
 *
 * let text = Text({
 *   text: 'Hello World!\nI can even be multiline!',
 *   font: '32px Arial',
 *   color: 'white',
 *   x: 300,
 *   y: 100,
 *   anchor: {x: 0.5, y: 0.5},
 *   textAlign: 'center'
 * });
 * // exclude-code:start
 * text.context = context;
 * // exclude-code:end
 *
 * text.render();
 * @class Text
 * @extends GameObject
 *
 * @param {Object} properties - Properties of the text.
 * @param {String} properties.text - The text to display.
 * @param {String} [properties.font] - The [font](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font) style. Defaults to the main context font.
 * @param {String} [properties.color] - Fill color for the text. Defaults to the main context fillStyle.
 * @param {Number} [properties.width] - Set a fixed width for the text. If set, the text will automatically be split into new lines that will fit the size when possible.
 * @param {String} [properties.textAlign='left'] - The [textAlign](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textAlign) for the context. If the `dir` attribute is set to `rtl` on the main canvas, the text will automatically be aligned to the right, but you can override that by setting this property.
 * @param {Number} [properties.lineHeight=1] - The distance between two lines of text.
 */
class Text extends factory$2.class {

  init({

    // --------------------------------------------------
    // defaults
    // --------------------------------------------------

    /**
     * The string of text. Use newline characters to create multi-line strings.
     * @memberof Text
     * @property {String} text
     */
    text = '',

    /**
     * The text alignment.
     * @memberof Text
     * @property {String} textAlign
     */
    textAlign = '',

    /**
     * The distance between two lines of text. The value is multiplied by the texts font size.
     * @memberof Text
     * @property {Number} lineHeight
     */
    lineHeight = 1,

   /**
    * The font style.
    * @memberof Text
    * @property {String} font
    */
    font = getContext().font,

    /**
     * The color of the text.
     * @memberof Text
     * @property {String} color
     */

     ...props
  } = {}) {
    super.init({
      text,
      textAlign,
      lineHeight,
      font,
      ...props
    });

    // p = prerender
    this._p();
  }

  // keep width and height getters/settings so we can set _w and _h and not
  // trigger infinite call loops
  get width() {
    // w = width
    return this._w;
  }

  set width(value) {
    // d = dirty
    this._d = true;
    this._w = value;

    // fw = fixed width
    this._fw = value;
  }

  get text() {
    return this._t;
  }

  set text(value) {
    this._d = true;
    this._t = value;
  }

  get font() {
    return this._f;
  }

  set font(value) {
    this._d = true;
    this._f = value;
    this._fs = parseFont(value).computed;
  }

  get lineHeight() {
    // lh = line height
    return this._lh;
  }

  set lineHeight(value) {
    this._d = true;
    this._lh = value;
  }

  render() {
    if (this._d) {
      this._p();
    }
    super.render();
  }

  /**
   * Calculate the font width, height, and text strings before rendering.
   */
  _p() {
    // s = strings
    this._s = [];
    this._d = false;
    let context = this.context;

    context.font = this.font;

    // @ifdef TEXT_AUTONEWLINE
    if (!this._s.length && this._fw) {
      let parts = this.text.split(' ');
      let start = 0;
      let i = 2;

      // split the string into lines that all fit within the fixed width
      for (; i <= parts.length; i++) {
        let str = parts.slice(start, i).join(' ');
        let width = context.measureText(str).width;

        if (width > this._fw) {
          this._s.push(parts.slice(start, i - 1).join(' '));
          start = i - 1;
        }
      }

      this._s.push(parts.slice(start, i).join(' '));
    }
    // @endif

    // @ifdef TEXT_NEWLINE
    if (!this._s.length && this.text.includes('\n')) {
      let width = 0;
      this.text.split('\n').map(str => {
        this._s.push(str);
        width = Math.max(width, context.measureText(str).width);
      });

      this._w = this._fw || width;
    }
    // @endif

    if (!this._s.length) {
      this._s.push(this.text);
      this._w = this._fw || context.measureText(this.text).width;
    }

    this.height = this._fs + ((this._s.length - 1) * this._fs * this.lineHeight);
    this._uw();
  }

  draw() {
    let alignX = 0;
    let textAlign = this.textAlign;
    let context = this.context;

    // @ifdef TEXT_RTL
    textAlign = this.textAlign || (context.canvas.dir === 'rtl' ? 'right' : 'left');
    // @endif

    // @ifdef TEXT_ALIGN||TEXT_RTL
    alignX = textAlign === 'right'
      ? this.width
      : textAlign === 'center'
        ? this.width / 2 | 0
        : 0;
    // @endif

    this._s.map((str, index) => {
      context.textBaseline = 'top';
      context.textAlign = textAlign;
      context.fillStyle = this.color;
      context.font = this.font;
      context.fillText(str, alignX, this._fs * this.lineHeight * index);
    });
  }
}

function factory$4() {
  return new Text(...arguments);
}
factory$4.prototype = Text.prototype;
factory$4.class = Text;

/**
 * Clear the canvas.
 */
function clear(context) {
  let canvas = context.canvas;
  context.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * The game loop updates and renders the game every frame. The game loop is stopped by default and will not start until the loops `start()` function is called.
 *
 * The game loop uses a time-based animation with a fixed `dt` to [avoid frame rate issues](http://blog.sklambert.com/using-time-based-animation-implement/). Each update call is guaranteed to equal 1/60 of a second.
 *
 * This means that you can avoid having to do time based calculations in your update functions and instead do fixed updates.
 *
 * ```js
 * import { Sprite, GameLoop } from 'kontra';
 *
 * let sprite = Sprite({
 *   x: 100,
 *   y: 200,
 *   width: 20,
 *   height: 40,
 *   color: 'red'
 * });
 *
 * let loop = GameLoop({
 *   update: function(dt) {
 *     // no need to determine how many pixels you want to
 *     // move every second and multiple by dt
 *     // sprite.x += 180 * dt;
 *
 *     // instead just update by how many pixels you want
 *     // to move every frame and the loop will ensure 60FPS
 *     sprite.x += 3;
 *   },
 *   render: function() {
 *     sprite.render();
 *   }
 * });
 *
 * loop.start();
 * ```
 * @class GameLoop
 *
 * @param {Object} properties - Properties of the game loop.
 * @param {(dt?: Number) => void} [properties.update] - Function called every frame to update the game. Is passed the fixed `dt` as a parameter.
 * @param {Function} properties.render - Function called every frame to render the game.
 * @param {Number}   [properties.fps=60] - Desired frame rate.
 * @param {Boolean}  [properties.clearCanvas=true] - Clear the canvas every frame before the `render()` function is called.
 * @param {CanvasRenderingContext2D} [properties.context] - The context that should be cleared each frame if `clearContext` is not set to `false`. Defaults to [core.getContext()](api/core#getContext).
 */
function GameLoop({
  fps = 60,
  clearCanvas = true,
  update = noop,
  render,
  context = getContext()
} = {}) {
  // check for required functions
  // @ifdef DEBUG
  if (!render) {
    throw Error('You must provide a render() function');
  }
  // @endif

  // animation variables
  let accumulator = 0;
  let delta = 1E3 / fps;  // delta between performance.now timings (in ms)
  let step = 1 / fps;
  let clearFn = clearCanvas ? clear : noop;
  let last, rAF, now, dt, loop;

  /**
   * Called every frame of the game loop.
   */
  function frame() {
    rAF = requestAnimationFrame(frame);

    now = performance.now();
    dt = now - last;
    last = now;

    // prevent updating the game with a very large dt if the game were to lose focus
    // and then regain focus later
    if (dt > 1E3) {
      return;
    }

    emit('tick');
    accumulator += dt;

    while (accumulator >= delta) {
      loop.update(step);

      accumulator -= delta;
    }

    clearFn(context);
    loop.render();
  }

  // game loop object
  loop = {
    /**
     * Called every frame to update the game. Put all of your games update logic here.
     * @memberof GameLoop
     * @function update
     *
     * @param {Number} [dt] - The fixed dt time of 1/60 of a frame.
     */
    update,

    /**
     * Called every frame to render the game. Put all of your games render logic here.
     * @memberof GameLoop
     * @function render
     */
    render,

    /**
     * If the game loop is currently stopped.
     *
     * ```js
     * import { GameLoop } from 'kontra';
     *
     * let loop = GameLoop({
     *   // ...
     * });
     * console.log(loop.isStopped);  //=> true
     *
     * loop.start();
     * console.log(loop.isStopped);  //=> false
     *
     * loop.stop();
     * console.log(loop.isStopped);  //=> true
     * ```
     * @memberof GameLoop
     * @property {Boolean} isStopped
     */
    isStopped: true,

    /**
     * Start the game loop.
     * @memberof GameLoop
     * @function start
     */
    start() {
      last = performance.now();
      this.isStopped = false;
      requestAnimationFrame(frame);
    },

    /**
     * Stop the game loop.
     * @memberof GameLoop
     * @function stop
     */
    stop() {
      this.isStopped = true;
      cancelAnimationFrame(rAF);
    },

    // expose properties for testing
    // @ifdef DEBUG
    _frame: frame,
    set _last(value) {
      last = value;
    }
    // @endif
  };

  return loop;
}

/**
 * A minimalistic keyboard API. You can use it move the main sprite or respond to a key press.
 *
 * ```js
 * import { initKeys, keyPressed } from 'kontra';
 *
 * // this function must be called first before keyboard
 * // functions will work
 * initKeys();
 *
 * function update() {
 *   if (keyPressed('left')) {
 *     // move left
 *   }
 * }
 * ```
 * @sectionName Keyboard
 */

/**
 * Below is a list of keys that are provided by default. If you need to extend this list, you can use the [keyMap](api/keyboard#keyMap) property.
 *
 * - a-z
 * - 0-9
 * - enter, esc, space, left, up, right, down
 * @sectionName Available Keys
 */

let callbacks$2 = {};
let pressedKeys = {};

/**
 * A map of keycodes to key names. Add to this object to expand the list of [available keys](api/keyboard#available-keys).
 *
 * ```js
 * import { keyMap, bindKeys } from 'kontra';
 *
 * keyMap[34] = 'pageDown';
 *
 * bindKeys('pageDown', function(e) {
 *   // handle pageDown key
 * });
 * ```
 * @property {{[key in (String|Number)]: string}} keyMap
 */
let keyMap = {
  // named keys
  'Enter': 'enter',
  'Escape': 'esc',
  'Space': 'space',
  'ArrowLeft': 'left',
  'ArrowUp': 'up',
  'ArrowRight': 'right',
  'ArrowDown': 'down'
};

/**
 * Execute a function that corresponds to a keyboard key.
 *
 * @param {KeyboardEvent} evt
 */
function keydownEventHandler(evt) {
  let key = keyMap[evt.code];
  pressedKeys[key] = true;

  if (callbacks$2[key]) {
    callbacks$2[key](evt);
  }
}

/**
 * Set the released key to not being pressed.
 *
 * @param {KeyboardEvent} evt
 */
function keyupEventHandler(evt) {
  pressedKeys[ keyMap[evt.code] ] = false;
}

/**
 * Reset pressed keys.
 */
function blurEventHandler$1() {
  pressedKeys = {};
}

/**
 * Initialize keyboard event listeners. This function must be called before using other keyboard functions.
 * @function initKeys
 */
function initKeys() {
  let i;

  // alpha keys
  // @see https://stackoverflow.com/a/43095772/2124254
  for (i = 0; i < 26; i++) {
    // rollupjs considers this a side-effect (for now), so we'll do it in the
    // initKeys function
    keyMap[i + 65] = keyMap['Key' + String.fromCharCode(i + 65)] = String.fromCharCode(i + 97);
  }

  // numeric keys
  for (i = 0; i < 10; i++) {
    keyMap[48+i] = keyMap['Digit'+i] = ''+i;
  }

  window.addEventListener('keydown', keydownEventHandler);
  window.addEventListener('keyup', keyupEventHandler);
  window.addEventListener('blur', blurEventHandler$1);
}

/**
 * Bind a set of keys that will call the callback function when they are pressed. Takes a single key or an array of keys. Is passed the original KeyboardEvent as a parameter.
 *
 * ```js
 * import { initKeys, bindKeys } from 'kontra';
 *
 * initKeys();
 *
 * bindKeys('p', function(e) {
 *   // pause the game
 * });
 * bindKeys(['enter', 'space'], function(e) {
 *   e.preventDefault();
 *   // fire gun
 * });
 * ```
 * @function bindKeys
 *
 * @param {String|String[]} keys - Key or keys to bind.
 * @param {(evt: KeyboardEvent) => void} callback - The function to be called when the key is pressed.
 */
function bindKeys(keys, callback) {
  // smaller than doing `Array.isArray(keys) ? keys : [keys]`
  [].concat(keys).map(key => callbacks$2[key] = callback);
}

/**
 * Check if a key is currently pressed. Use during an `update()` function to perform actions each frame.
 *
 * ```js
 * import { Sprite, initKeys, keyPressed } from 'kontra';
 *
 * initKeys();
 *
 * let sprite = Sprite({
 *   update: function() {
 *     if (keyPressed('left')){
 *       // left arrow pressed
 *     }
 *     else if (keyPressed('right')) {
 *       // right arrow pressed
 *     }
 *
 *     if (keyPressed('up')) {
 *       // up arrow pressed
 *     }
 *     else if (keyPressed('down')) {
 *       // down arrow pressed
 *     }
 *   }
 * });
 * ```
 * @function keyPressed
 *
 * @param {String} key - Key to check for pressed state.
 *
 * @returns {Boolean} `true` if the key is pressed, `false` otherwise.
 */
function keyPressed(key) {
  return !!pressedKeys[key];
}

/**
 * A tile engine for managing and drawing tilesets.
 *
 * <figure>
 *   <a href="assets/imgs/mapPack_tilesheet.png">
 *     <img src="assets/imgs/mapPack_tilesheet.png" width="1088" height="768" alt="Tileset to create an overworld map in various seasons.">
 *   </a>
 *   <figcaption>Tileset image courtesy of <a href="https://kenney.nl/assets">Kenney</a>.</figcaption>
 * </figure>
 * @class TileEngine
 *
 * @param {Object} properties - Properties of the tile engine.
 * @param {Number} properties.width - Width of the tile map (in number of tiles).
 * @param {Number} properties.height - Height of the tile map (in number of tiles).
 * @param {Number} properties.tilewidth - Width of a single tile (in pixels).
 * @param {Number} properties.tileheight - Height of a single tile (in pixels).
 * @param {CanvasRenderingContext2D} [properties.context] - The context the tile engine should draw to. Defaults to [core.getContext()](api/core#getContext)
 *
 * @param {Object[]} properties.tilesets - Array of tileset objects.
 * @param {Number} properties.tilesetN.firstgid - First tile index of the tileset. The first tileset will have a firstgid of 1 as 0 represents an empty tile.
 * @param {String|HTMLImageElement} properties.tilesetN.image - Relative path to the HTMLImageElement or an HTMLImageElement. If passing a relative path, the image file must have been [loaded](api/assets#load) first.
 * @param {Number} [properties.tilesetN.margin=0] - The amount of whitespace between each tile (in pixels).
 * @param {Number} [properties.tilesetN.tilewidth] - Width of the tileset (in pixels). Defaults to properties.tilewidth.
 * @param {Number} [properties.tilesetN.tileheight] - Height of the tileset (in pixels). Defaults to properties.tileheight.
 * @param {String} [properties.tilesetN.source] - Relative path to the source JSON file. The source JSON file must have been [loaded](api/assets#load) first.
 * @param {Number} [properties.tilesetN.columns] - Number of columns in the tileset image.
 *
 * @param {Object[]} properties.layers - Array of layer objects.
 * @param {String} properties.layerN.name - Unique name of the layer.
 * @param {Number[]} properties.layerN.data - 1D array of tile indices.
 * @param {Boolean} [properties.layerN.visible=true] - If the layer should be drawn or not.
 * @param {Number} [properties.layerN.opacity=1] - Percent opacity of the layer.
 */

/**
 * @docs docs/api_docs/tileEngine.js
 */

function TileEngine(properties) {
  let {
    width,
    height,
    tilewidth,
    tileheight,
    context = getContext(),
    tilesets,
    layers
  } = properties;

  let mapwidth = width * tilewidth;
  let mapheight = height * tileheight;

  // create an off-screen canvas for pre-rendering the map
  // @see http://jsperf.com/render-vs-prerender
  let offscreenCanvas = document.createElement('canvas');
  let offscreenContext = offscreenCanvas.getContext('2d');
  offscreenCanvas.width = mapwidth;
  offscreenCanvas.height = mapheight;

  // map layer names to data
  let layerMap = {};
  let layerCanvases = {};

  // objects added to tile engine to sync with the camera
  let objects = [];

  /**
   * The width of tile map (in tiles).
   * @memberof TileEngine
   * @property {Number} width
   */

  /**
   * The height of tile map (in tiles).
   * @memberof TileEngine
   * @property {Number} height
   */

  /**
   * The width a tile (in pixels).
   * @memberof TileEngine
   * @property {Number} tilewidth
   */

  /**
   * The height of a tile (in pixels).
   * @memberof TileEngine
   * @property {Number} tileheight
   */

  /**
   * Array of all layers of the tile engine.
   * @memberof TileEngine
   * @property {Object[]} layers
   */

  /**
   * Array of all tilesets of the tile engine.
   * @memberof TileEngine
   * @property {Object[]} tilesets
   */

  let tileEngine = Object.assign({

    /**
     * The context the tile engine will draw to.
     * @memberof TileEngine
     * @property {CanvasRenderingContext2D} context
     */
    context: context,

    /**
     * The width of the tile map (in pixels).
     * @memberof TileEngine
     * @property {Number} mapwidth
     */
    mapwidth: mapwidth,

    /**
     * The height of the tile map (in pixels).
     * @memberof TileEngine
     * @property {Number} mapheight
     */
    mapheight: mapheight,
    _sx: 0,
    _sy: 0,

    // d = dirty
    _d: false,

    /**
     * X coordinate of the tile map camera.
     * @memberof TileEngine
     * @property {Number} sx
     */
    get sx() {
      return this._sx;
    },

    /**
     * Y coordinate of the tile map camera.
     * @memberof TileEngine
     * @property {Number} sy
     */
    get sy() {
      return this._sy;
    },

    // when clipping an image, sx and sy must within the image region, otherwise
    // Firefox and Safari won't draw it.
    // @see http://stackoverflow.com/questions/19338032/canvas-indexsizeerror-index-or-size-is-negative-or-greater-than-the-allowed-a
    set sx(value) {
      this._sx = clamp(0, mapwidth - getCanvas().width, value);
      objects.forEach(obj => obj.sx = this._sx);
    },

    set sy(value) {
      this._sy = clamp(0, mapheight - getCanvas().height, value);
      objects.forEach(obj => obj.sy = this._sy);
    },

    /**
     * Render all visible layers.
     * @memberof TileEngine
     * @function render
     */
    render() {
      if (this._d) {
        this._d = false;
        this._p();
      }

      render(offscreenCanvas);
    },

    /**
     * Render a specific layer by name.
     * @memberof TileEngine
     * @function renderLayer
     *
     * @param {String} name - Name of the layer to render.
     */
    renderLayer(name) {
      let canvas = layerCanvases[name];
      let layer = layerMap[name];

      if (!canvas) {
        // cache the rendered layer so we can render it again without redrawing
        // all tiles
        canvas = document.createElement('canvas');
        canvas.width = mapwidth;
        canvas.height = mapheight;

        layerCanvases[name] = canvas;
        tileEngine._r(layer, canvas.getContext('2d'));
      }

      if (layer._d) {
        layer._d = false;
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        tileEngine._r(layer, canvas.getContext('2d'));
      }

      render(canvas);
    },

    /**
     * Check if the object collides with the layer (shares a gird coordinate with any positive tile index in layers data). The object being checked must have the properties `x`, `y`, `width`, and `height` so that its position in the grid can be calculated. [Sprite](api/sprite) defines these properties for you.
     *
     * ```js
     * import { TileEngine, Sprite } from 'kontra';
     *
     * let tileEngine = TileEngine({
     *   tilewidth: 32,
     *   tileheight: 32,
     *   width: 4,
     *   height: 4,
     *   tilesets: [{
     *     // ...
     *   }],
     *   layers: [{
     *     name: 'collision',
     *     data: [ 0,0,0,0,
     *             0,1,4,0,
     *             0,2,5,0,
     *             0,0,0,0 ]
     *   }]
     * });
     *
     * let sprite = Sprite({
     *   x: 50,
     *   y: 20,
     *   width: 5,
     *   height: 5
     * });
     *
     * tileEngine.layerCollidesWith('collision', sprite);  //=> false
     *
     * sprite.y = 28;
     *
     * tileEngine.layerCollidesWith('collision', sprite);  //=> true
     * ```
     * @memberof TileEngine
     * @function layerCollidesWith
     *
     * @param {String} name - The name of the layer to check for collision.
     * @param {Object} object - Object to check collision against.
     *
     * @returns {boolean} `true` if the object collides with a tile, `false` otherwise.
     */
    layerCollidesWith(name, object) {
      let { x, y, width, height } = getWorldRect(object);

      let row = getRow(y);
      let col = getCol(x);
      let endRow = getRow(y + height);
      let endCol = getCol(x + width);

      let layer = layerMap[name];

      // check all tiles
      for (let r = row; r <= endRow; r++) {
        for (let c = col; c <= endCol; c++) {
          if (layer.data[c + r * this.width]) {
            return true;
          }
        }
      }

      return false;
    },

    /**
     * Get the tile at the specified layer using either x and y coordinates or row and column coordinates.
     *
     * ```js
     * import { TileEngine } from 'kontra';
     *
     * let tileEngine = TileEngine({
     *   tilewidth: 32,
     *   tileheight: 32,
     *   width: 4,
     *   height: 4,
     *   tilesets: [{
     *     // ...
     *   }],
     *   layers: [{
     *     name: 'collision',
     *     data: [ 0,0,0,0,
     *             0,1,4,0,
     *             0,2,5,0,
     *             0,0,0,0 ]
     *   }]
     * });
     *
     * tileEngine.tileAtLayer('collision', {x: 50, y: 50});  //=> 1
     * tileEngine.tileAtLayer('collision', {row: 2, col: 1});  //=> 2
     * ```
     * @memberof TileEngine
     * @function tileAtLayer
     *
     * @param {String} name - Name of the layer.
     * @param {{x: Number, y: Number}|{row: Number, col: Number}} position - Position of the tile in either {x, y} or {row, col} coordinates.
     *
     * @returns {Number} The tile index. Will return `-1` if no layer exists by the provided name.
     */
    tileAtLayer(name, position) {
      let row = position.row || getRow(position.y);
      let col = position.col || getCol(position.x);

      if (layerMap[name]) {
        return layerMap[name].data[col + row * tileEngine.width];
      }

      return -1;
    },

    /**
     * Set the tile at the specified layer using either x and y coordinates or row and column coordinates.
     *
     * ```js
     * import { TileEngine } from 'kontra';
     *
     * let tileEngine = TileEngine({
     *   tilewidth: 32,
     *   tileheight: 32,
     *   width: 4,
     *   height: 4,
     *   tilesets: [{
     *     // ...
     *   }],
     *   layers: [{
     *     name: 'collision',
     *     data: [ 0,0,0,0,
     *             0,1,4,0,
     *             0,2,5,0,
     *             0,0,0,0 ]
     *   }]
     * });
     *
     * tileEngine.setTileAtLayer('collision', {row: 2, col: 1}, 10);
     * tileEngine.tileAtLayer('collision', {row: 2, col: 1});  //=> 10
     * ```
     * @memberof TileEngine
     * @function setTileAtLayer
     *
     * @param {String} name - Name of the layer.
     * @param {{x: Number, y: Number}|{row: Number, col: Number}} position - Position of the tile in either {x, y} or {row, col} coordinates.
     * @param {Number} tile - Tile index to set.
     */
    setTileAtLayer(name, position, tile) {
      let row = position.row || getRow(position.y);
      let col = position.col || getCol(position.x);

      if (layerMap[name]) {
        this._d = true;
        layerMap[name]._d = true;
        layerMap[name].data[col + row * tileEngine.width] = tile;
      }
    },

    /**
    * Set the data at the specified layer.
    * 
    * ```js
    * import { TileEngine } from 'kontra';
    *
    * let tileEngine = TileEngine({
    *   tilewidth: 32,
    *   tileheight: 32,
    *   width: 2,
    *   height: 2,
    *   tilesets: [{
    *     // ...
    *   }],
    *   layers: [{
    *     name: 'collision',
    *     data: [ 0,1,
    *             2,3 ]
    *   }]
    * });
    *
    * tileEngine.setLayer('collision', [ 4,5,6,7]);
    * tileEngine.tileAtLayer('collision', {row: 0, col: 0});  //=> 4
    * tileEngine.tileAtLayer('collision', {row: 0, col: 1});  //=> 5
    * tileEngine.tileAtLayer('collision', {row: 1, col: 0});  //=> 6
    * tileEngine.tileAtLayer('collision', {row: 1, col: 1});  //=> 7
    * ```
    * 
    * @memberof TileEngine
    * @function setLayer
    * 
    * @param {String} name - Name of the layer.
    * @param {Number[]} data - 1D array of tile indices.
    */
    setLayer(name, data) {
      if (layerMap[name]) {
        this._d = true;
        layerMap[name]._d = true;
        layerMap[name].data = data;
      }
    },

    /**
     * Add an object to the tile engine. The tile engine will set the objects camera position (`sx`, `sy`) to be in sync with the tile engine camera. [Sprite](api/sprite) uses this information to draw the sprite to the correct position on the canvas.
     * @memberof TileEngine
     * @function addObject
     *
     * @param {Object} object - Object to add to the tile engine.
     */
    addObject(object) {
      objects.push(object);
      object.sx = this._sx;
      object.sy = this._sy;
    },

    /**
     * Remove an object from the tile engine.
     * @memberof TileEngine
     * @function removeObject
     *
     * @param {Object} object - Object to remove from the tile engine.
     */
    removeObject(object) {
      let index = objects.indexOf(object);
      if (index !== -1) {
        objects.splice(index, 1);
        object.sx = object.sy = 0;
      }
    },

    // expose for testing
    _r: renderLayer,
    _p: prerender,

    // @ifdef DEBUG
    layerCanvases: layerCanvases,
    layerMap: layerMap
    // @endif
  }, properties);

  // resolve linked files (source, image)
  tileEngine.tilesets.map(tileset => {
    // get the url of the Tiled JSON object (in this case, the properties object)
    let url = (window.__k ? window.__k.dm.get(properties) : '') || window.location.href;

    if (tileset.source) {
      // @ifdef DEBUG
      if (!window.__k) {
        throw Error(`You must use "load" or "loadData" to resolve tileset.source`);
      }
      // @endif

      let source = window.__k.d[window.__k.u(tileset.source, url)];

      // @ifdef DEBUG
      if (!source) {
        throw Error(`You must load the tileset source "${tileset.source}" before loading the tileset`);
      }
      // @endif

      Object.keys(source).map(key => {
        tileset[key] = source[key];
      });
    }

    if (''+tileset.image === tileset.image) {
      // @ifdef DEBUG
      if (!window.__k) {
        throw Error(`You must use "load" or "loadImage" to resolve tileset.image`);
      }
      // @endif

      let image = window.__k.i[window.__k.u(tileset.image, url)];

      // @ifdef DEBUG
      if (!image) {
        throw Error(`You must load the image "${tileset.image}" before loading the tileset`);
      }
      // @endif

      tileset.image = image;
    }
  });

  /**
   * Get the row from the y coordinate.
   * @private
   *
   * @param {Number} y - Y coordinate.
   *
   * @return {Number}
   */
  function getRow(y) {
    return y / tileEngine.tileheight | 0;
  }

  /**
   * Get the col from the x coordinate.
   * @private
   *
   * @param {Number} x - X coordinate.
   *
   * @return {Number}
   */
  function getCol(x) {
    return x / tileEngine.tilewidth | 0;
  }

  /**
   * Render a layer.
   * @private
   *
   * @param {Object} layer - Layer data.
   * @param {Context} context - Context to draw layer to.
   */
  function renderLayer(layer, context) {
    context.save();
    context.globalAlpha = layer.opacity;

    (layer.data || []).map((tile, index) => {

      // skip empty tiles (0)
      if (!tile) return;

      // find the tileset the tile belongs to
      // assume tilesets are ordered by firstgid
      let tileset;
      for (let i = tileEngine.tilesets.length-1; i >= 0; i--) {
        tileset = tileEngine.tilesets[i];

        if (tile / tileset.firstgid >= 1) {
          break;
        }
      }

      let tilewidth = tileset.tilewidth || tileEngine.tilewidth;
      let tileheight = tileset.tileheight || tileEngine.tileheight;
      let margin = tileset.margin || 0;

      let image = tileset.image;

      let offset = tile - tileset.firstgid;
      let cols = tileset.columns ||
        image.width / (tilewidth + margin) | 0;

      let x = (index % tileEngine.width) * tilewidth;
      let y = (index / tileEngine.width | 0) * tileheight;
      let sx = (offset % cols) * (tilewidth + margin);
      let sy = (offset / cols | 0) * (tileheight + margin);

      context.drawImage(
        image,
        sx, sy, tilewidth, tileheight,
        x, y, tilewidth, tileheight
      );
    });

    context.restore();
  }

  /**
   * Pre-render the tiles to make drawing fast.
   * @private
   */
  function prerender() {
    if (tileEngine.layers) {
      tileEngine.layers.map(layer => {
        layer._d = false;
        layerMap[layer.name] = layer;

        if (layer.data && layer.visible !== false) {
          tileEngine._r(layer, offscreenContext);
        }
      });
    }
  }

  /**
   * Render a tile engine canvas.
   * @private
   *
   * @param {HTMLCanvasElement} canvas - Tile engine canvas to draw.
   */
  function render(canvas) {
    const { width, height } = getCanvas();
    const sWidth = Math.min(canvas.width, width);
    const sHeight = Math.min(canvas.height, height);

    tileEngine.context.drawImage(
      canvas,
      tileEngine.sx, tileEngine.sy, sWidth, sHeight,
      0, 0, sWidth, sHeight
    );
  }

  prerender();
  return tileEngine;
}var author = "Kasper Seweryn <github@wvffle.net>";const creditsText = () => {
  return factory$4({
    text: `js13k submission by ${author}`,
    color: '#fff',
    y: innerHeight - 16,
    x: 8
  })
};var tilesets = [
	"colored_tilemap_packed.png"
];
var layers = [
	{
		data: [
			57,
			2,
			2,
			2,
			2,
			58,
			2,
			2,
			2,
			2,
			2,
			2,
			2,
			2,
			2,
			58,
			15,
			16,
			16,
			16,
			52,
			18,
			61,
			16,
			16,
			12,
			16,
			16,
			61,
			16,
			16,
			18,
			15,
			48,
			61,
			61,
			12,
			18,
			16,
			81,
			16,
			61,
			12,
			16,
			16,
			16,
			16,
			18,
			15,
			16,
			16,
			16,
			16,
			18,
			16,
			61,
			16,
			12,
			16,
			61,
			16,
			61,
			61,
			18,
			57,
			2,
			2,
			2,
			31,
			58,
			2,
			2,
			58,
			2,
			2,
			30,
			2,
			4,
			16,
			18,
			15,
			16,
			16,
			16,
			61,
			18,
			16,
			16,
			18,
			16,
			16,
			61,
			16,
			18,
			61,
			18,
			15,
			61,
			16,
			11,
			16,
			18,
			61,
			16,
			18,
			16,
			12,
			16,
			52,
			18,
			16,
			18,
			15,
			16,
			16,
			16,
			16,
			18,
			16,
			16,
			18,
			61,
			16,
			16,
			16,
			18,
			12,
			18,
			15,
			11,
			16,
			61,
			45,
			32,
			16,
			61,
			18,
			16,
			16,
			61,
			16,
			18,
			61,
			18,
			15,
			16,
			16,
			16,
			55,
			16,
			16,
			16,
			18,
			2,
			2,
			2,
			2,
			32,
			16,
			18,
			15,
			16,
			61,
			16,
			18,
			16,
			16,
			61,
			18,
			16,
			16,
			16,
			16,
			16,
			16,
			18,
			57,
			2,
			2,
			2,
			58,
			16,
			16,
			16,
			18,
			16,
			11,
			16,
			16,
			16,
			61,
			18,
			15,
			16,
			61,
			16,
			43,
			61,
			16,
			16,
			18,
			16,
			16,
			16,
			61,
			16,
			16,
			18,
			15,
			5,
			16,
			61,
			16,
			16,
			16,
			16,
			69,
			16,
			16,
			16,
			16,
			16,
			11,
			18,
			15,
			16,
			16,
			61,
			45,
			16,
			16,
			61,
			18,
			16,
			16,
			61,
			16,
			16,
			16,
			18,
			59,
			31,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59
		],
		flips: {
			"33": 4
		}
	}
];
var width = 16;
var height = 16;
var tileSize = 8;var layers$1 = [
	{
		data: [
			57,
			2,
			2,
			2,
			2,
			2,
			58,
			2,
			2,
			2,
			2,
			58,
			2,
			2,
			2,
			58,
			15,
			16,
			16,
			16,
			16,
			16,
			18,
			16,
			16,
			61,
			16,
			18,
			16,
			16,
			61,
			18,
			15,
			47,
			16,
			16,
			5,
			16,
			69,
			16,
			16,
			16,
			10,
			18,
			16,
			20,
			61,
			18,
			15,
			16,
			16,
			16,
			16,
			16,
			18,
			16,
			16,
			16,
			16,
			18,
			61,
			16,
			16,
			18,
			57,
			2,
			2,
			2,
			2,
			2,
			58,
			16,
			61,
			16,
			16,
			18,
			2,
			2,
			30,
			58,
			15,
			61,
			16,
			16,
			16,
			61,
			18,
			16,
			16,
			16,
			16,
			18,
			16,
			81,
			16,
			18,
			15,
			16,
			16,
			16,
			12,
			16,
			18,
			16,
			10,
			16,
			16,
			18,
			16,
			16,
			61,
			18,
			15,
			12,
			16,
			16,
			16,
			16,
			55,
			16,
			16,
			16,
			61,
			18,
			16,
			16,
			10,
			18,
			15,
			16,
			16,
			61,
			12,
			16,
			18,
			16,
			16,
			16,
			16,
			18,
			16,
			16,
			16,
			18,
			15,
			61,
			16,
			16,
			16,
			16,
			18,
			16,
			16,
			61,
			16,
			18,
			61,
			16,
			16,
			18,
			15,
			16,
			16,
			16,
			16,
			16,
			18,
			16,
			16,
			16,
			10,
			18,
			16,
			16,
			16,
			18,
			57,
			2,
			2,
			31,
			2,
			2,
			58,
			2,
			2,
			31,
			2,
			58,
			16,
			10,
			16,
			18,
			15,
			16,
			61,
			16,
			16,
			16,
			18,
			16,
			16,
			16,
			16,
			18,
			16,
			16,
			16,
			18,
			15,
			48,
			16,
			16,
			61,
			12,
			18,
			16,
			61,
			12,
			16,
			69,
			16,
			16,
			61,
			18,
			15,
			16,
			16,
			10,
			52,
			16,
			18,
			16,
			16,
			61,
			16,
			18,
			16,
			16,
			61,
			18,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59
		],
		flips: {
		}
	}
];var layers$2 = [
	{
		data: [
			57,
			2,
			2,
			2,
			58,
			2,
			2,
			2,
			2,
			2,
			2,
			2,
			2,
			2,
			2,
			58,
			15,
			61,
			52,
			16,
			18,
			61,
			16,
			16,
			69,
			16,
			16,
			16,
			16,
			16,
			61,
			18,
			15,
			48,
			24,
			16,
			55,
			16,
			24,
			16,
			18,
			16,
			61,
			16,
			10,
			16,
			16,
			18,
			15,
			16,
			16,
			61,
			18,
			16,
			16,
			61,
			18,
			16,
			16,
			16,
			16,
			16,
			16,
			18,
			57,
			2,
			2,
			2,
			2,
			2,
			4,
			16,
			18,
			16,
			10,
			16,
			121,
			16,
			10,
			18,
			15,
			16,
			16,
			16,
			16,
			16,
			18,
			24,
			18,
			16,
			16,
			61,
			16,
			16,
			16,
			18,
			15,
			61,
			16,
			10,
			61,
			16,
			69,
			16,
			18,
			16,
			16,
			16,
			10,
			16,
			61,
			18,
			15,
			61,
			16,
			16,
			16,
			16,
			18,
			61,
			18,
			16,
			61,
			16,
			16,
			16,
			16,
			18,
			15,
			16,
			16,
			16,
			61,
			16,
			18,
			2,
			2,
			58,
			2,
			2,
			2,
			2,
			31,
			58,
			15,
			24,
			16,
			61,
			16,
			24,
			18,
			61,
			16,
			69,
			16,
			16,
			61,
			16,
			16,
			18,
			15,
			16,
			16,
			16,
			16,
			16,
			18,
			61,
			16,
			18,
			16,
			24,
			16,
			16,
			61,
			18,
			57,
			2,
			2,
			31,
			2,
			2,
			58,
			30,
			57,
			32,
			16,
			61,
			16,
			24,
			16,
			18,
			15,
			16,
			61,
			16,
			16,
			16,
			18,
			61,
			15,
			16,
			16,
			16,
			61,
			16,
			16,
			18,
			15,
			47,
			16,
			5,
			16,
			61,
			18,
			61,
			15,
			81,
			16,
			12,
			16,
			16,
			24,
			18,
			15,
			16,
			16,
			16,
			16,
			16,
			18,
			52,
			15,
			16,
			61,
			16,
			16,
			61,
			16,
			18,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59
		],
		flips: {
			"33": 4,
			"209": 4
		}
	}
];var layers$3 = [
	{
		data: [
			57,
			2,
			2,
			2,
			2,
			2,
			58,
			2,
			2,
			2,
			2,
			2,
			2,
			2,
			2,
			58,
			15,
			16,
			16,
			61,
			16,
			16,
			18,
			61,
			16,
			16,
			16,
			52,
			16,
			16,
			16,
			18,
			15,
			47,
			61,
			16,
			5,
			16,
			18,
			16,
			16,
			16,
			16,
			16,
			23,
			61,
			16,
			18,
			15,
			16,
			16,
			16,
			16,
			61,
			18,
			16,
			61,
			23,
			16,
			16,
			16,
			16,
			61,
			18,
			57,
			2,
			2,
			2,
			31,
			2,
			32,
			16,
			16,
			16,
			16,
			61,
			16,
			23,
			16,
			18,
			15,
			16,
			16,
			61,
			16,
			16,
			16,
			24,
			16,
			16,
			23,
			16,
			16,
			16,
			16,
			18,
			15,
			61,
			24,
			16,
			61,
			16,
			16,
			16,
			61,
			16,
			16,
			16,
			61,
			61,
			16,
			18,
			57,
			2,
			2,
			2,
			58,
			2,
			2,
			2,
			2,
			2,
			2,
			58,
			2,
			2,
			31,
			58,
			15,
			16,
			16,
			16,
			18,
			23,
			61,
			16,
			23,
			16,
			16,
			43,
			16,
			16,
			16,
			18,
			15,
			10,
			61,
			16,
			55,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			61,
			23,
			16,
			18,
			15,
			16,
			16,
			16,
			18,
			16,
			16,
			61,
			16,
			23,
			16,
			46,
			16,
			16,
			61,
			18,
			57,
			2,
			2,
			31,
			2,
			2,
			4,
			16,
			16,
			16,
			16,
			57,
			2,
			30,
			2,
			58,
			15,
			16,
			61,
			16,
			16,
			16,
			18,
			2,
			2,
			31,
			2,
			15,
			61,
			16,
			16,
			18,
			15,
			48,
			16,
			16,
			61,
			12,
			18,
			16,
			16,
			61,
			16,
			15,
			16,
			5,
			16,
			18,
			15,
			16,
			16,
			23,
			52,
			16,
			18,
			16,
			23,
			81,
			16,
			15,
			67,
			95,
			61,
			18,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59
		],
		flips: {
			"221": 3,
			"236": 6,
			"237": 5
		}
	}
];var layers$4 = [
	{
		data: [
			57,
			2,
			2,
			2,
			2,
			2,
			2,
			2,
			2,
			2,
			2,
			2,
			2,
			2,
			2,
			58,
			15,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			61,
			16,
			16,
			16,
			16,
			16,
			16,
			18,
			15,
			16,
			61,
			122,
			16,
			61,
			16,
			16,
			16,
			16,
			16,
			16,
			122,
			16,
			61,
			18,
			15,
			16,
			16,
			28,
			16,
			16,
			16,
			16,
			16,
			61,
			16,
			16,
			28,
			16,
			16,
			18,
			15,
			61,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			61,
			16,
			18,
			15,
			16,
			16,
			16,
			61,
			16,
			122,
			16,
			16,
			122,
			16,
			16,
			16,
			16,
			16,
			18,
			15,
			16,
			16,
			16,
			16,
			16,
			28,
			16,
			16,
			28,
			16,
			61,
			16,
			16,
			61,
			18,
			15,
			16,
			61,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			18,
			15,
			16,
			16,
			16,
			16,
			16,
			122,
			16,
			9,
			122,
			16,
			16,
			16,
			16,
			16,
			18,
			15,
			16,
			16,
			61,
			16,
			16,
			28,
			16,
			16,
			28,
			16,
			16,
			61,
			16,
			16,
			18,
			15,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			18,
			15,
			61,
			16,
			122,
			16,
			16,
			61,
			16,
			16,
			16,
			61,
			16,
			122,
			16,
			61,
			18,
			15,
			16,
			16,
			28,
			16,
			16,
			16,
			16,
			61,
			16,
			16,
			16,
			28,
			16,
			16,
			18,
			15,
			47,
			16,
			16,
			61,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			18,
			15,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			16,
			61,
			16,
			16,
			16,
			18,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59,
			59
		],
		flips: {
			"209": 4
		}
	}
];const getTransparentSprite = (image, size, id, transparentColor = '#222323') => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = canvas.height = size;

  const width = image.width / size;
  const x = size * ((id - 1) % width);
  const y = size * ((id - 1) / width ^ 0);
  context.drawImage(image, x, y, size, size, 0, 0, size, size);

  const imageData = context.getImageData(0, 0, size, size);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i] === 34 && data[i + 1] === data[i + 2] && data[i + 2] === 35) {
      data[i + 3] = 0;
    }
  }

  context.putImageData(imageData, 0, 0);

  // 34 35 35

  return canvas
};class Entity {
  constructor (gameObject) {
    this.object = gameObject;
  }

  update () {
    this.object.update();
  }

  render () {
    return this.object.render()
  }
}const TILESET = new Promise((resolve, reject) => {
  const img = new Image;
  img.src = tilesets[0];

  img.onload = () => {
    resolve(img);
  };

  img.onerror = err => reject(err);
});

const TILE_GROUND = 16;
const TILE_SPAWN = 5;

const MAPS = [
  layers,
  layers$1,
  layers$2,
  layers$3,
  layers$4
];
const indexToRenderedXY = i => ({
  x: tileSize * (i % width), 
  y: tileSize * (i / width ^ 0) 
});

async function levelLoader (n = 0) {
  const image = await TILESET;

  const [map] = MAPS[n];

  const meta = {
    spawn: -1,
    key: -1,
    door: -1,
    secret: -1,
    stairs: -1,
    dog: -1,
    fire: -1,
    chests: [],
    skeletons: [],
    zombies: [],
    cultists: [],
    ghosts: [],
    slimes: [],
  };

  map.data = map.data.map((id, i) => {
    if (id === TILE_SPAWN) {
      meta.spawn = i;

      return TILE_GROUND
    }

    if (id === 11) {
      meta.skeletons.push(i);
      return TILE_GROUND
    }

    if (id === 12) {
      meta.zombies.push(i);
      return TILE_GROUND
    }

    if (id === 10) {
      meta.cultists.push(i);
      return TILE_GROUND
    }

    if (id === 24) {
      meta.ghosts.push(i);
      return TILE_GROUND
    }

    if (id === 23) {
      meta.slimes.push(i);
      return TILE_GROUND
    }

    if (id === 20) {
      meta.dog = i;
      return TILE_GROUND
    }

    if (id === 20) {
      meta.fire = i;
    }


    if (id === 81) {
      meta.key = i;
    }

    if (id === 55) {
      meta.door = i;
    }

    if (id === 48) {
      meta.stairs = i;
    }

    if (id === 52) {
      meta.chests.push(i);
    }

    return id
  });

  const engine = TileEngine({
    tilewidth: tileSize,
    tileheight: tileSize,
    width,
    height,
    tilesets: [{ firstgid: 1, image }],
    layers: [map]
  });

  const player = new Entity(factory$3({
    ...indexToRenderedXY(meta.spawn),
    image: getTransparentSprite(image, tileSize, TILE_SPAWN)
  }));

  engine.addObject(player);

  return { 
    engine, 
    player
  }
}const { canvas, context: context$1 } = init('c');

// Physics
const SPEED = .6;

// Scale context
const SCALE = 5;
canvas.height = canvas.width = SCALE * 8 * 16;
context$1.imageSmoothingEnabled = false;
context$1.scale(SCALE, SCALE);

Promise.resolve().then(async () => {
  // Init controls
  initKeys();

  // Init objects and scenes
  const credits = creditsText();
  let level = await levelLoader();

  // Bind keys
  
  // @ifdef DEBUG
  const debug = {
    ids: false
  };

  bindKeys('0', () => {
    debug.ids = !debug.ids;
  });
  for (const n of [0, 1, 2, 3, 4]) {
    bindKeys((n + 1).toString(), async () => {
      level = await levelLoader(n);
    });
  }

  GameLoop({
    update () {
      const moveFlags = 8 * keyPressed('h')
        + 4 * keyPressed('j')
        + 2 * keyPressed('k')
        + keyPressed('l');

      level.player.object.velocity.x = 0;
      level.player.object.velocity.y = 0;

      if (moveFlags & 0b1000) {
        level.player.object.velocity.x -= SPEED;
      }

      if (moveFlags & 0b0001) {
        level.player.object.velocity.x += SPEED;
      }

      if (moveFlags & 0b0010) {
        level.player.object.velocity.y -= SPEED;
      }

      if (moveFlags & 0b0100) {
        level.player.object.velocity.y += SPEED;
      }

      level.player.update();
    },

    render () {
      level.engine.render();
      level.player.render();

      // @ifdef DEBUG
      if (debug.ids) {
        level.engine.layers[0].data.map((id, i) => {
          const x = i % 16;
          const y = i / 16 ^ 0;

          context$1.font = '3px monospace';
          context$1.fillStyle = '#000';
          context$1.fillText(id, x * 8 + .2, y * 8 + 8.2);
          context$1.fillStyle = '#fff';
          context$1.fillText(id, x * 8, y * 8 + 8);
        });
      }
      // @endif

      credits.render();
    }
  }).start();
});}());