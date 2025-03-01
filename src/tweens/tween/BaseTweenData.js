/**
 * @author       Richard Davey <rich@phaser.io>
 * @copyright    2013-2025 Phaser Studio Inc.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

var Class = require('../../utils/Class');
var Events = require('../events');
var TWEEN_CONST = require('./const');

/**
 * @classdesc
 * BaseTweenData is the class that the TweenData and TweenFrameData classes
 * extend from. You should not typically instantiate this class directly, but instead
 * use it to form your own tween data classes from, should you require it.
 *
 * Prior to Phaser 3.60 the TweenData was just an object, but was refactored to a class,
 * to make it responsible for its own state and updating.
 *
 * @class BaseTweenData
 * @memberof Phaser.Tweens
 * @constructor
 * @since 3.60.0
 *
 * @param {Phaser.Tweens.Tween} tween - The tween this TweenData instance belongs to.
 * @param {number} targetIndex - The target index within the Tween targets array.
 * @param {string} key - The property of the target to tween.
 * @param {Phaser.Types.Tweens.GetEndCallback} getEnd - What the property will be at the END of the Tween.
 * @param {Phaser.Types.Tweens.GetStartCallback} getStart - What the property will be at the START of the Tween.
 * @param {?Phaser.Types.Tweens.GetActiveCallback} getActive - If not null, is invoked _immediately_ as soon as the TweenData is running, and is set on the target property.
 * @param {function} ease - The ease function this tween uses.
 * @param {function} delay - Function that returns the time in milliseconds before tween will start.
 * @param {number} duration - The duration of the tween in milliseconds.
 * @param {boolean} yoyo - Determines whether the tween should return back to its start value after hold has expired.
 * @param {number} hold - Function that returns the time in milliseconds the tween will pause before repeating or returning to its starting value if yoyo is set to true.
 * @param {number} repeat - Function that returns the number of times to repeat the tween. The tween will always run once regardless, so a repeat value of '1' will play the tween twice.
 * @param {number} repeatDelay - Function that returns the time in milliseconds before the repeat will start.
 * @param {boolean} flipX - Should toggleFlipX be called when yoyo or repeat happens?
 * @param {boolean} flipY - Should toggleFlipY be called when yoyo or repeat happens?
 * @param {?function} interpolation - The interpolation function to be used for arrays of data. Defaults to 'null'.
 * @param {?number[]} interpolationData - The array of interpolation data to be set. Defaults to 'null'.
 */
var BaseTweenData = new Class({

    initialize:

    function BaseTweenData (tween, targetIndex, delay, duration, yoyo, hold, repeat, repeatDelay, flipX, flipY)
    {
        /**
         * A reference to the Tween that this TweenData instance belongs to.
         *
         * @name Phaser.Tweens.BaseTweenData#tween
         * @type {Phaser.Tweens.Tween}
         * @since 3.60.0
         */
        this.tween = tween;

        /**
         * The index of the target within the Tween `targets` array.
         *
         * @name Phaser.Tweens.BaseTweenData#targetIndex
         * @type {number}
         * @since 3.60.0
         */
        this.targetIndex = targetIndex;

        /**
         * The duration of the tween in milliseconds, excluding any time required
         * for yoyo or repeats. A tween can never have a duration of zero, so this
         * will be set to 0.01 if the value is incorrectly less than or equal to zero.
         *
         * @name Phaser.Tweens.BaseTweenData#duration
         * @type {number}
         * @since 3.60.0
         */
        this.duration = (duration <= 0) ? 0.01 : duration;

        /**
         * The total calculated duration, in milliseconds, of this TweenData.
         * Factoring in the duration, repeats, delays and yoyos.
         *
         * @name Phaser.Tweens.BaseTweenData#totalDuration
         * @type {number}
         * @since 3.60.0
         */
        this.totalDuration = 0;

        /**
         * The time, in milliseconds, before this tween will start playing.
         *
         * This value is generated by the `getDelay` function.
         *
         * @name Phaser.Tweens.BaseTweenData#delay
         * @type {number}
         * @since 3.60.0
         */
        this.delay = 0;

        /**
         * This function returns the value to be used for `TweenData.delay`.
         *
         * @name Phaser.Tweens.BaseTweenData#getDelay
         * @type {function}
         * @since 3.60.0
         */
        this.getDelay = delay;

        /**
         * Will the Tween ease back to its starting values, after reaching the end
         * and any `hold` value that may be set?
         *
         * @name Phaser.Tweens.BaseTweenData#yoyo
         * @type {boolean}
         * @since 3.60.0
         */
        this.yoyo = yoyo;

        /**
         * The time, in milliseconds, before this tween will start a yoyo to repeat.
         *
         * @name Phaser.Tweens.BaseTweenData#hold
         * @type {number}
         * @since 3.60.0
         */
        this.hold = hold;

        /**
         * The number of times this tween will repeat.
         *
         * The tween will always run once regardless of this value,
         * so a repeat value of '1' will play the tween twice: I.e. the original
         * play-through and then it repeats that once (1).
         *
         * If this value is set to -1 this tween will repeat forever.
         *
         * @name Phaser.Tweens.BaseTweenData#repeat
         * @type {number}
         * @since 3.60.0
         */
        this.repeat = repeat;

        /**
         * The time, in milliseconds, before the repeat will start.
         *
         * @name Phaser.Tweens.BaseTweenData#repeatDelay
         * @type {number}
         * @since 3.60.0
         */
        this.repeatDelay = repeatDelay;

        /**
         * How many repeats are left to run?
         *
         * @name Phaser.Tweens.BaseTweenData#repeatCounter
         * @type {number}
         * @since 3.60.0
         */
        this.repeatCounter = 0;

        /**
         * If `true` this Tween will call `toggleFlipX` on the Tween target
         * whenever it yoyo's or repeats. It will only be called if the target
         * has a function matching this name, like most Phaser GameObjects do.
         *
         * @name Phaser.Tweens.BaseTweenData#flipX
         * @type {boolean}
         * @since 3.60.0
         */
        this.flipX = flipX;

        /**
         * If `true` this Tween will call `toggleFlipY` on the Tween target
         * whenever it yoyo's or repeats. It will only be called if the target
         * has a function matching this name, like most Phaser GameObjects do.
         *
         * @name Phaser.Tweens.BaseTweenData#flipY
         * @type {boolean}
         * @since 3.60.0
         */
        this.flipY = flipY;

        /**
         * A value between 0 and 1 holding the progress of this TweenData.
         *
         * @name Phaser.Tweens.BaseTweenData#progress
         * @type {number}
         * @since 3.60.0
         */
        this.progress = 0;

        /**
         * The amount of time, in milliseconds, that has elapsed since this
         * TweenData was made active.
         *
         * @name Phaser.Tweens.BaseTweenData#elapsed
         * @type {number}
         * @since 3.60.0
         */
        this.elapsed = 0;

        /**
         * The state of this TweenData.
         *
         * @name Phaser.Tweens.BaseTweenData#state
         * @type {Phaser.Tweens.StateType}
         * @since 3.60.0
         */
        this.state = 0;

        /**
         * Is this Tween Data currently waiting for a countdown to elapse, or not?
         *
         * @name Phaser.Tweens.BaseTweenData#isCountdown
         * @type {boolean}
         * @since 3.60.0
         */
        this.isCountdown = false;
    },

    /**
     * Returns a reference to the target object belonging to this TweenData.
     *
     * @method Phaser.Tweens.BaseTweenData#getTarget
     * @since 3.60.0
     *
     * @return {object} The target object. Can be any JavaScript object, but is typically a Game Object.
     */
    getTarget: function ()
    {
        return this.tween.targets[this.targetIndex];
    },

    /**
     * Sets this TweenData's target object property to be the given value.
     *
     * @method Phaser.Tweens.BaseTweenData#setTargetValue
     * @since 3.60.0
     *
     * @param {number} [value] - The value to set on the target. If not given, sets it to the last `current` value.
     */
    setTargetValue: function (value)
    {
        if (value === undefined) { value = this.current; }

        this.tween.targets[this.targetIndex][this.key] = value;
    },

    /**
     * Sets this TweenData state to CREATED.
     *
     * @method Phaser.Tweens.BaseTweenData#setCreatedState
     * @since 3.60.0
     */
    setCreatedState: function ()
    {
        this.state = TWEEN_CONST.CREATED;
        this.isCountdown = false;
    },

    /**
     * Sets this TweenData state to DELAY.
     *
     * @method Phaser.Tweens.BaseTweenData#setDelayState
     * @since 3.60.0
     */
    setDelayState: function ()
    {
        this.state = TWEEN_CONST.DELAY;
        this.isCountdown = true;
    },

    /**
     * Sets this TweenData state to PENDING_RENDER.
     *
     * @method Phaser.Tweens.BaseTweenData#setPendingRenderState
     * @since 3.60.0
     */
    setPendingRenderState: function ()
    {
        this.state = TWEEN_CONST.PENDING_RENDER;
        this.isCountdown = false;
    },

    /**
     * Sets this TweenData state to PLAYING_FORWARD.
     *
     * @method Phaser.Tweens.BaseTweenData#setPlayingForwardState
     * @since 3.60.0
     */
    setPlayingForwardState: function ()
    {
        this.state = TWEEN_CONST.PLAYING_FORWARD;
        this.isCountdown = false;
    },

    /**
     * Sets this TweenData state to PLAYING_BACKWARD.
     *
     * @method Phaser.Tweens.BaseTweenData#setPlayingBackwardState
     * @since 3.60.0
     */
    setPlayingBackwardState: function ()
    {
        this.state = TWEEN_CONST.PLAYING_BACKWARD;
        this.isCountdown = false;
    },

    /**
     * Sets this TweenData state to HOLD_DELAY.
     *
     * @method Phaser.Tweens.BaseTweenData#setHoldState
     * @since 3.60.0
     */
    setHoldState: function ()
    {
        this.state = TWEEN_CONST.HOLD_DELAY;
        this.isCountdown = true;
    },

    /**
     * Sets this TweenData state to REPEAT_DELAY.
     *
     * @method Phaser.Tweens.BaseTweenData#setRepeatState
     * @since 3.60.0
     */
    setRepeatState: function ()
    {
        this.state = TWEEN_CONST.REPEAT_DELAY;
        this.isCountdown = true;
    },

    /**
     * Sets this TweenData state to COMPLETE.
     *
     * @method Phaser.Tweens.BaseTweenData#setCompleteState
     * @since 3.60.0
     */
    setCompleteState: function ()
    {
        this.state = TWEEN_CONST.COMPLETE;
        this.isCountdown = false;
    },

    /**
     * Returns `true` if this TweenData has a _current_ state of CREATED, otherwise `false`.
     *
     * @method Phaser.Tweens.BaseTweenData#isCreated
     * @since 3.60.0
     *
     * @return {boolean} `true` if this TweenData has a _current_ state of CREATED, otherwise `false`.
     */
    isCreated: function ()
    {
        return (this.state === TWEEN_CONST.CREATED);
    },

    /**
     * Returns `true` if this TweenData has a _current_ state of DELAY, otherwise `false`.
     *
     * @method Phaser.Tweens.BaseTweenData#isDelayed
     * @since 3.60.0
     *
     * @return {boolean} `true` if this TweenData has a _current_ state of DELAY, otherwise `false`.
     */
    isDelayed: function ()
    {
        return (this.state === TWEEN_CONST.DELAY);
    },

    /**
     * Returns `true` if this TweenData has a _current_ state of PENDING_RENDER, otherwise `false`.
     *
     * @method Phaser.Tweens.BaseTweenData#isPendingRender
     * @since 3.60.0
     *
     * @return {boolean} `true` if this TweenData has a _current_ state of PENDING_RENDER, otherwise `false`.
     */
    isPendingRender: function ()
    {
        return (this.state === TWEEN_CONST.PENDING_RENDER);
    },

    /**
     * Returns `true` if this TweenData has a _current_ state of PLAYING_FORWARD, otherwise `false`.
     *
     * @method Phaser.Tweens.BaseTweenData#isPlayingForward
     * @since 3.60.0
     *
     * @return {boolean} `true` if this TweenData has a _current_ state of PLAYING_FORWARD, otherwise `false`.
     */
    isPlayingForward: function ()
    {
        return (this.state === TWEEN_CONST.PLAYING_FORWARD);
    },

    /**
     * Returns `true` if this TweenData has a _current_ state of PLAYING_BACKWARD, otherwise `false`.
     *
     * @method Phaser.Tweens.BaseTweenData#isPlayingBackward
     * @since 3.60.0
     *
     * @return {boolean} `true` if this TweenData has a _current_ state of PLAYING_BACKWARD, otherwise `false`.
     */
    isPlayingBackward: function ()
    {
        return (this.state === TWEEN_CONST.PLAYING_BACKWARD);
    },

    /**
     * Returns `true` if this TweenData has a _current_ state of HOLD_DELAY, otherwise `false`.
     *
     * @method Phaser.Tweens.BaseTweenData#isHolding
     * @since 3.60.0
     *
     * @return {boolean} `true` if this TweenData has a _current_ state of HOLD_DELAY, otherwise `false`.
     */
    isHolding: function ()
    {
        return (this.state === TWEEN_CONST.HOLD_DELAY);
    },

    /**
     * Returns `true` if this TweenData has a _current_ state of REPEAT_DELAY, otherwise `false`.
     *
     * @method Phaser.Tweens.BaseTweenData#isRepeating
     * @since 3.60.0
     *
     * @return {boolean} `true` if this TweenData has a _current_ state of REPEAT_DELAY, otherwise `false`.
     */
    isRepeating: function ()
    {
        return (this.state === TWEEN_CONST.REPEAT_DELAY);
    },

    /**
     * Returns `true` if this TweenData has a _current_ state of COMPLETE, otherwise `false`.
     *
     * @method Phaser.Tweens.BaseTweenData#isComplete
     * @since 3.60.0
     *
     * @return {boolean} `true` if this TweenData has a _current_ state of COMPLETE, otherwise `false`.
     */
    isComplete: function ()
    {
        return (this.state === TWEEN_CONST.COMPLETE);
    },

    /**
     * Internal method used as part of the playback process that checks if this
     * TweenData should yoyo, repeat, or has completed.
     *
     * @method Phaser.Tweens.BaseTweenData#setStateFromEnd
     * @fires Phaser.Tweens.Events#TWEEN_REPEAT
     * @fires Phaser.Tweens.Events#TWEEN_YOYO
     * @since 3.60.0
     *
     * @param {number} diff - Any extra time that needs to be accounted for in the elapsed and progress values.
     */
    setStateFromEnd: function (diff)
    {
        if (this.yoyo)
        {
            this.onRepeat(diff, true, true);
        }
        else if (this.repeatCounter > 0)
        {
            this.onRepeat(diff, true, false);
        }
        else
        {
            this.setCompleteState();
        }
    },

    /**
     * Internal method used as part of the playback process that checks if this
     * TweenData should repeat or has completed.
     *
     * @method Phaser.Tweens.BaseTweenData#setStateFromStart
     * @fires Phaser.Tweens.Events#TWEEN_REPEAT
     * @since 3.60.0
     *
     * @param {number} diff - Any extra time that needs to be accounted for in the elapsed and progress values.
     */
    setStateFromStart: function (diff)
    {
        if (this.repeatCounter > 0)
        {
            this.onRepeat(diff, false);
        }
        else
        {
            this.setCompleteState();
        }
    },

    /**
     * Internal method that resets this Tween Data entirely, including the progress and elapsed values.
     *
     * Called automatically by the parent Tween. Should not be called directly.
     *
     * @method Phaser.Tweens.BaseTweenData#reset
     * @since 3.60.0
     */
    reset: function ()
    {
        var tween = this.tween;
        var totalTargets = tween.totalTargets;

        var targetIndex = this.targetIndex;
        var target = tween.targets[targetIndex];
        var key = this.key;

        this.progress = 0;
        this.elapsed = 0;

        //  Function signature: target, key, value, index, total, tween

        this.delay = this.getDelay(target, key, 0, targetIndex, totalTargets, tween);

        this.repeatCounter = (this.repeat === -1) ? TWEEN_CONST.MAX : this.repeat;

        this.setPendingRenderState();

        //  calcDuration:

        //  Set t1 (duration + hold + yoyo)
        var t1 = this.duration + this.hold;

        if (this.yoyo)
        {
            t1 += this.duration;
        }

        //  Set t2 (repeatDelay + duration + hold + yoyo)
        var t2 = t1 + this.repeatDelay;

        //  Total Duration
        this.totalDuration = this.delay + t1;

        if (this.repeat === -1)
        {
            this.totalDuration += (t2 * TWEEN_CONST.MAX);
            tween.isInfinite = true;
        }
        else if (this.repeat > 0)
        {
            this.totalDuration += (t2 * this.repeat);
        }

        if (this.totalDuration > tween.duration)
        {
            //  Set the longest duration in the parent Tween
            tween.duration = this.totalDuration;
        }

        if (this.delay < tween.startDelay)
        {
            tween.startDelay = this.delay;
        }

        if (this.delay > 0)
        {
            this.elapsed = this.delay;

            this.setDelayState();
        }
    },

    /**
     * Internal method that handles repeating or yoyo'ing this TweenData.
     *
     * Called automatically by `setStateFromStart` and `setStateFromEnd`.
     *
     * @method Phaser.Tweens.BaseTweenData#onRepeat
     * @fires Phaser.Tweens.Events#TWEEN_REPEAT
     * @fires Phaser.Tweens.Events#TWEEN_YOYO
     * @since 3.60.0
     *
     * @param {number} diff - Any extra time that needs to be accounted for in the elapsed and progress values.
     * @param {boolean} setStart - Set the TweenData start values?
     * @param {boolean} isYoyo - Is this call a Yoyo check?
     */
    onRepeat: function (diff, setStart, isYoyo)
    {
        var tween = this.tween;
        var totalTargets = tween.totalTargets;

        var targetIndex = this.targetIndex;
        var target = tween.targets[targetIndex];
        var key = this.key;

        var isTweenData = (key !== 'texture');

        //  Account for any extra time we got from the previous frame
        this.elapsed = diff;
        this.progress = diff / this.duration;

        if (this.flipX)
        {
            target.toggleFlipX();
        }

        if (this.flipY)
        {
            target.toggleFlipY();
        }

        if (isTweenData && (setStart || isYoyo))
        {
            this.start = this.getStartValue(target, key, this.start, targetIndex, totalTargets, tween);
        }

        if (isYoyo)
        {
            this.setPlayingBackwardState();

            this.dispatchEvent(Events.TWEEN_YOYO, 'onYoyo');

            return;
        }

        this.repeatCounter--;

        //  Custom
        if (isTweenData)
        {
            this.end = this.getEndValue(target, key, this.start, targetIndex, totalTargets, tween);
        }

        //  Delay?
        if (this.repeatDelay > 0)
        {
            this.elapsed = this.repeatDelay - diff;

            if (isTweenData)
            {
                this.current = this.start;

                target[key] = this.current;
            }

            this.setRepeatState();
        }
        else
        {
            this.setPlayingForwardState();

            this.dispatchEvent(Events.TWEEN_REPEAT, 'onRepeat');
        }
    },

    /**
     * Immediately destroys this TweenData, nulling of all its references.
     *
     * @method Phaser.Tweens.BaseTweenData#destroy
     * @since 3.60.0
     */
    destroy: function ()
    {
        this.tween = null;
        this.getDelay = null;
        this.setCompleteState();
    }

});

module.exports = BaseTweenData;
