/*
* Blog Slide Show
*
* @package blogslideshow
* @author Dmitry Sheiko
* @version $Revision$
* @license GNU
* @copyright (c) Dmitry Sheiko http://dsheiko.com
* @projectDescription A fancy image viewer, that supports many different types of transition
*                     effects including CSS3/HTML5-related.
* @param {effect : string } - effect can be one of following fade, scroll, ladder,
*                                          jalousie, rotate, zoom, null
* @return void

* Project page: http://blogslideshow.googlecode.com/
* Usage examples:
*   YUI({
*        modules: {
*            bsShow: {
*               fullpath: 'yui3.blogslideshow.js'
*            },
*            bsShowCss: {
*               fullpath: 'blogslideshow.css',
*               type: 'css'
*            }
*        }
*    }).use('bsShow', 'bsShowCss', 'widget', 'widget-stack', 'event', function(Y){
*        Y.namespace('app').bsShow.start({effect:'fade'});
*    });
*
*
* Compatibility:
*	Tested with Google Chrome 4.1, Firefox 3.6.3, Opera 10.10, Apple Safari 4.0.5, IE 8
*	Requires jQuery 1.4+
*
*/
YUI.add('bsShow', function(Y){

/**
 * Constants
 */
var MIN_WIDTH  = 300,
    MIN_HEIGHT = 300,
    EOVERLAY_TPL = '<div id="ss-effect-overlay" class="hidden">' +
                   '<div></div><div></div><div></div><div></div><div></div>' +
                   '<div></div><div></div><div></div><div></div><div></div>' +
                   '</div>',
    SPRITE_TPL = '<img id="ss-sprite" src="" class="hidden" />',
    MASK_TPL = '<div id="ss-mask"><!-- --></div>';

/**
 * Variation of asynchronous queue, which iterates given callback specified number of times
 * @TODO: modify this to use Y.AsyncQueue
 */
var aQueue = {
    iterator : 0,
    timer : null,
    options : {},
    chain : [],
    /**
     * Add an asynchronous iterator intothe queue, which will call 'iteratedCallback' of
     * 'iterations' times and then call 'completedCallback'
     * The method is chainable
     * @param object options {
     *      function options.startedCallback
     *      function options.iteratedCallback
     *      function options.completedCallback
     *      int options.iterations - number of iterations
     *      int options.delay - delay in msec
     *      boolean options.reverse - when reverse is true, decrementing, otherwise incrementing
     *      object options.scope - context of use
     * }
     * @return object aQueue
     */
    add : function(options) {
        aQueue.chain.push(options);
        return aQueue;
    },
    /**
     * Run the queue
     * @return void
     */
    run : function() {
        if (aQueue.chain.length) {
            var options = aQueue.chain.shift();
            aQueue.options = options;
            if (undefined !== options.startedCallback) {
                options.startedCallback(options.scope); // I decided started event handler should
            }                                           // be here for the sake of unified interface
            if (undefined === options.iterations) {
                return;
            }
            aQueue.iterator = 0;
            if (undefined !== options.reverse) {
                aQueue.iterator = options.iterations + 1;
                aQueue.deiterate();
            } else {
                aQueue.iterate();
            }
        }
    },
    /**
     * Iterates iteratedCallback till the number of iterations approaches iterations
     * @return void
     */
    iterate : function() {
        if (++aQueue.iterator <= aQueue.options.iterations) {
            aQueue.options.iteratedCallback(aQueue.iterator, aQueue.options.iterations
                , aQueue.options.scope);
            aQueue.timer = setTimeout(aQueue.iterate, aQueue.options.delay);
        } else {
            aQueue.options.completedCallback(aQueue.options.scope);
            aQueue.timer = null;
            aQueue.run();
        }
    },
    /**
     * Deiterates iteratedCallback
     * @return void
     */
    deiterate : function() {
        if (--aQueue.iterator >= 1) {
            aQueue.options.iteratedCallback(aQueue.iterator, aQueue.options.iterations
                , aQueue.options.scope);
            aQueue.timer = setTimeout(aQueue.deiterate, aQueue.options.delay);
        } else {
            aQueue.options.completedCallback(aQueue.options.scope);
            aQueue.timer = null;
            aQueue.run();
        }
    },
    /**
     * Cancel the queue
     */
    stop : function() {
        aQueue.timer = null;
        aQueue.iterator = aQueue.options.reverse ? 0 : aQueue.options.iterations + 1;
        aQueue.chain = [];
    }
}

    /**
     * Show effect callbacks
     */
    var effect = {
        /**
         * Opacity style setter
         * @param HTMLNode node
         * @param string value
         */
        opacity : function(node, value) {
            node.setStyle('filter', 'alpha(opacity:' + value + ')');
            node.setStyle('opacity', value / 100);
        },
        /**
         * Transformation style setter
         * @param HTMLNode node
         * @param string value
         */
        transform : function(node, value) {
            node.setStyle('webkitTransform', value);
            node.setStyle('MozTransform', value);
        },
        /**
         * Align node to the screen center. When donor specified the node is aligned
         * according to donor size
         * @param HTMLNode node
         * @param HTMLNode donor OPTIONAL
         */
        centerBy : function(node, donor) {
             if (undefined === donor) {
                 donor = node;
             }
             node.setStyle('left',
                Math.ceil(document.body.scrollLeft + Y.one('body').get('winWidth') / 2
                    - donor.get('width') / 2) + "px"
             );
             node.setStyle('top',
                Math.ceil(document.body.scrollTop + Y.one('body').get('winHeight') / 2
                    - donor.get('height') / 2) + "px"
             );
        },
        /**
         * Makes node size the same as donor
         * @param HTMLNode node
         * @param HTMLNode donor
         */
        sizeBy : function(node, donor) {
            node.setStyle('width', donor.get('width') + 'px');
            node.setStyle('height', donor.get('height') + 'px');
        },
        /**
         * Makes node position the same as donor
         * @param HTMLNode node
         * @param HTMLNode donor
         */
        positionBy : function(node, donor) {
            node.setStyle('top', donor.getStyle('top'));
            node.setStyle('left', donor.getStyle('left'));
        },
        /**
         * Fade effect
         */
        _fadeStarted : function(scope) {
            scope.get('spriteNode').removeClass('hidden');
            effect.opacity(scope.get('spriteNode'), 0);
            scope.get('spriteNode').set('src', scope.get('active'));
            effect.centerBy(scope.get('spriteNode'));
        },
        _fadeIterated : function(counter, number, scope) {
            effect.opacity(scope.get('spriteNode'), counter * number * 10);
        },
        _fadeCompleted : function(scope) {
            scope.get('imageNode').set('src', scope.get('active'));
            effect.opacity(scope.get('spriteNode'), 100);
            effect.centerBy(scope.get('boundingBox'), scope.get('imageNode'));
            scope.get('spriteNode').addClass('hidden');
        },
       /**
         * Jalousie effect
         */
        _jalousieStarted : function(scope) {
            scope.get('spriteNode').set('src', scope.get('active'));
            effect.sizeBy(scope.get('eOverlayNode'), scope.get('spriteNode'));
            effect.centerBy(scope.get('eOverlayNode'), scope.get('spriteNode'));
            scope.get('eOverlayNode').removeClass('hidden');
            var maxW = scope.get('spriteNode').get('width');
            scope.get('eOverlayNode').get('children').each(function(node, i){
                node.setStyle('backgroundImage', 'url(' + scope.get('active') + ')');
                node.setStyle('backgroundPosition', '-' + Math.ceil(i * maxW / 10) + 'px 0px');
                effect.transform(node, 'scale(0.1, 1)');
            }, this);
        },
        _jalousieIterated : function(counter, number, scope) {
            scope.get('eOverlayNode').get('children').each(function(node, i){
                effect.transform(node, 'scale(' + (counter / number) + ', 1)');
            }, this);
            effect.opacity(scope.get('imageNode'), (number - counter) * number * 10);
        },
        _jalousieCompleted : function(scope) {
            scope.get('imageNode').set('src', scope.get('active'));
            effect.opacity(scope.get('imageNode'), 100);
            effect.positionBy(scope.get('boundingBox'), scope.get('eOverlayNode'));
            scope.get('eOverlayNode').addClass('hidden');
        },
        /**
         * Ladder effect
         */
        _ladderStarted : function(scope) {
            scope.get('boundingBox').setStyle('background',
                'url(' + scope.get('imageNode').get('src') + ') center center no-repeat');
            scope.get('spriteNode').set('src', scope.get('active'));
            effect.centerBy(scope.get('boundingBox'), scope.get('spriteNode'));
            effect.sizeBy(scope.get('boundingBox'), scope.get('spriteNode'));
            scope.get('imageNode').set('src', "");
            effect.sizeBy(scope.get('eOverlayNode'), scope.get('spriteNode'));
            effect.centerBy(scope.get('eOverlayNode'), scope.get('spriteNode'));
            scope.get('eOverlayNode').removeClass('hidden');
        },
        _ladderIterated : function(counter, number, scope) {
            var maxH = scope.get('spriteNode').get('height');
            var maxW = scope.get('spriteNode').get('width');
            scope.get('eOverlayNode').get('children').each(function(node, i){
                var h = Math.ceil((counter-1) * maxH / number - ( i * maxH / 10));
                if (h > maxH) {
                    h = maxH;
                }
                if (h < 0) {
                    h = 0;
                }
                node.setStyle('backgroundImage', 'url(' + scope.get('active') + ')');
                node.setStyle('backgroundPosition', '-' + Math.ceil(i*maxW/10) + 'px ' + h + 'px');
            }, this);
        },
        _ladderCompleted : function(scope) {
            scope.get('imageNode').set('src', scope.get('active'));
            effect.positionBy(scope.get('boundingBox'), scope.get('eOverlayNode'));
            scope.get('eOverlayNode').addClass('hidden');
            scope.get('boundingBox').setStyle('background', "");
            scope.get('eOverlayNode').get('children').each(function(node, i){
                node.setStyle('background', '');
            }, this);
        },
       /**
        * Scroll left effect
        */
        _scrollStarted : function(scope) {
            scope.get('boundingBox').setStyle('background',
                'url(' + scope.get('imageNode').get('src') + ') center center no-repeat');
            scope.get('spriteNode').set('src', scope.get('active'));
            effect.centerBy(scope.get('boundingBox'), scope.get('spriteNode'));
            effect.sizeBy(scope.get('boundingBox'), scope.get('spriteNode'));
            scope.get('imageNode').set('src', scope.get('active'));
            scope.get('imageNode').setStyle('left', scope.get('spriteNode').get('width') + 'px');
            scope.get('boundingBox').setStyle('overflow', 'hidden');
            scope.get('imageNode').setStyle('position', 'relative');
        },
        _scrollIterated : function(counter, number, scope) {
            scope.get('imageNode').setStyle('left', Math.ceil((counter - 1)
                * scope.get('spriteNode').get('width') / number) + 'px');
        },
        _scrollCompleted : function(scope) {
            scope.get('imageNode').setStyle('left', "0px");
            scope.get('boundingBox').setStyle('width', 'auto');
            scope.get('boundingBox').setStyle('height', 'auto');
            scope.get('boundingBox').setStyle('overflow', '');
            scope.get('imageNode').setStyle('position', '');
            scope.get('boundingBox').setStyle('background', '');
        },
        /**
        * Rotate effect
        */
        _rotateStarted : function(scope) {
            scope.get('boundingBox').setStyle('background',
                'url(' + scope.get('imageNode').get('src') + ') center center no-repeat');
            scope.get('spriteNode').set('src', scope.get('active'));
            effect.centerBy(scope.get('boundingBox'), scope.get('spriteNode'));
            effect.sizeBy(scope.get('boundingBox'), scope.get('spriteNode'));
            scope.get('imageNode').set('src', scope.get('active'));

        },
        _rotateIterated : function(counter, number, scope) {
            effect.transform(scope.get('imageNode'),
                'rotate(' + (counter * 45) + 'deg) scale('+ (counter / number) +')');
        },
        _rotateCompleted : function(scope) {
            effect.transform(scope.get('imageNode'),'rotate(0deg) scale(1)');
            scope.get('boundingBox').setStyle('width', 'auto');
            scope.get('boundingBox').setStyle('height', 'auto');
            scope.get('boundingBox').setStyle('background', '');
        },
         /**
        * Zoom effect
        */
        _zoomStarted : function(scope) {
            scope.get('spriteNode').set('src', scope.get('active'));
        },
        _zoomHalfCompleted : function(scope) {
            effect.centerBy(scope.get('boundingBox'), scope.get('spriteNode'));
            effect.sizeBy(scope.get('boundingBox'), scope.get('spriteNode'));
            scope.get('imageNode').set('src', scope.get('active'));
        },
        _zoomIterated : function(counter, number, scope) {
            effect.transform(scope.get('imageNode'), 'scale('+ (counter / number) +')');
        },
        _zoomCompleted : function(scope) {
            scope.get('boundingBox').setStyle('width', 'auto');
            scope.get('boundingBox').setStyle('height', 'auto');
            effect.transform(scope.get('imageNode'), 'scale(1)');
        }
    };

     /**
     *
     * @class
     * @constructor
     * @param {object} cfg
     */
    function bsShow(cfg){
         bsShow.superclass.constructor.call(this, cfg);
    }
      /**
     *
     * @static
     * @type {string}
     */
    bsShow.NAME = 'bsShow';

    /**
     *
     * @static
     * @type {object}
     */
    bsShow.ATTRS = {

           /**
            * @attribute css
            * @default blogslideshow.css
            * @type {string}
            */
           css: {
               value: 'blogslideshow.css'
           },
           /**
            * @attribute effect
            * @default fade
            * @type {boolean}
            */
           effect: {
               value: 'fade'
           },
           render: {
               value: true
           },
           shim: {
               value: true
           },
           active : null,
           // Placeholders
            toolbarNode : null, // Toolbar area with navigation buttons
            maskNode : null, // Mask frezzeing the screen
            prevBtnNode : null, // To previous image button
            nextBtnNode : null, // To next image button
            closeBtnNode : null, // Close overlay button
            imageNode : null, // Image object
            spriteNode: null, // Sprite which is used for visual effects
            eOverlayNode: null
    };

    /**
     *
     * @statuc
     * @type {object}
     */
    bsShow.HTML_PARSER = {
            /**
             * @type {YUI.Node}
             */
            toolbarNode: "#ss-toolbar",
            /**
             * @type {YUI.Node}
             */
            prevBtnNode: "#ss-prev",
            /**
             * @type {YUI.Node}
             */
            nextBtnNode: "#ss-next",
            /**
             * @type {YUI.Node}
             */
            closeBtnNode: "#ss-close",
            /**
             * @type {YUI.Node}
             */
            imageNode: "#ss-image"

    };

    Y.namespace('app').bsShow = Y.extend(bsShow, Y.Widget, {
        images : [],
       /**
         *
         * @type {string}
         */
        BOUNDING_TEMPLATE: '<div id="ss-window"></div>',

        /**
         *
         * @type {string}
         */
        CONTENT_TEMPLATE: '<img id="ss-image" src="" class="hidden" />' +
                '<div id="ss-toolbar" class="hidden">' +
                '   <div id="ss-prev" class="ss-btn"><!-- --></div>' +
                '   <div id="ss-close" class="ss-btn"><!-- --></div>' +
                '   <div id="ss-next" class="ss-btn"><!-- --></div>' +
                '</div>',

         /**
         *
         * @return void
         */
        initializer: function(cfg){
        },

        /**
         *
         * @return void
         */
        renderUI: function(){
            Y.one('body').prepend(MASK_TPL);
            Y.one('body').append(SPRITE_TPL);
            Y.one('body').append(EOVERLAY_TPL);
            this.set('maskNode', Y.one('#ss-mask'));
            this.set('spriteNode', Y.one('#ss-sprite'));
            this.set('eOverlayNode', Y.one('#ss-effect-overlay'));
            this.get('imageNode').set('src', this.get('active'));
            this.get('imageNode').on('load', this.center, this);
        },
        /**
         *
         * @return void
         */
        bindUI: function(){
            var i = 0;
            Y.all('a[rel=blogslideshow]').each(function(node, i) {
                 if (node.get('href')) {
                    // Storages required info
                    this.images[i] = new Image();
                    this.images[i].src = node.get('href');
                    this.images[i].rel = node.get('href');
                 }
            }, this);

            this.get('maskNode').on('click', this._onClickClose, this);
            this.get('closeBtnNode').on('click', this._onClickClose, this);
            this.get('boundingBox').on('mouseover', function(e) {
                this.get('toolbarNode').removeClass('hidden');
            }, this);
            this.get('boundingBox').on('mouseout', function(e) {
                this.get('toolbarNode').addClass('hidden');
            }, this);
            this.get('prevBtnNode').on('click', this._onClickPrev, this);
            this.get('nextBtnNode').on('click', this._onClickNext, this);
            Y.one(document).detach('keydown').on('keydown', this._onKeypress, this);
        },
        // Event handlers
        _onKeypress : function(e) {
            try {
            // Escape
            if (27 == e.keyCode) {
                this._onClickClose(e);
            }
            // Next
            if (39 == e.keyCode) {
                this._onClickNext(e);
            }
            // Previous
            if (37 == e.keyCode) {
                this._onClickPrev(e);
            }
            } catch(ex) {}
        },
         _onClickClose : function(e) {
            e.preventDefault();
            this.get('maskNode').remove();
            this.get('spriteNode').remove();
            this.get('eOverlayNode').remove();
            this.destroy();
        },
         _onClickPrev : function(e) {
            e.preventDefault();
            this.showImage(this.getNavigation().prev);
        },
         _onClickNext : function(e) {
            e.preventDefault();
            this.showImage(this.getNavigation().next);
        },
        // Public methods
        showImage : function(href, init) {
            if (null === href || !href.length) {
                return;
            }
            this.set('active', href);
            if (this.get('effect') && undefined === init)  {
            switch (this.get('effect')) {
                 case 'fade' :
                        aQueue.add({
                            startedCallback: effect._fadeStarted,
                            iteratedCallback: effect._fadeIterated,
                            completedCallback: effect._fadeCompleted,
                            iterations: 3,
                            delay: 100,
                            scope: this}).run();
                        break;
                    case 'jalousie' :
                        aQueue.add({
                            startedCallback: effect._jalousieStarted,
                            iteratedCallback: effect._jalousieIterated,
                            completedCallback: effect._jalousieCompleted,
                            iterations: 5,
                            delay: 50,
                            scope: this}).run();
                        break;
                    case 'ladder' :
                        aQueue.add({
                            startedCallback: effect._ladderStarted,
                            iteratedCallback: effect._ladderIterated,
                            completedCallback: effect._ladderCompleted,
                            iterations: 20,
                            delay: 50,
                            reverse: true,
                            scope: this}).run();
                        break;
                    case 'scroll' :
                        aQueue.add({
                            startedCallback: effect._scrollStarted,
                            iteratedCallback: effect._scrollIterated,
                            completedCallback: effect._scrollCompleted,
                            iterations: 5,
                            delay: 150,
                            reverse: true,
                            scope: this}).run();
                        break;
                     case 'rotate' :
                        aQueue.add({
                            startedCallback: effect._rotateStarted,
                            iteratedCallback: effect._rotateIterated,
                            completedCallback: effect._rotateCompleted,
                            iterations: 10,
                            delay: 50,
                            scope: this}).run();
                        break;
                    case 'zoom' :
                        aQueue.add({
                            startedCallback: effect._zoomStarted,
                            iteratedCallback: effect._zoomIterated,
                            completedCallback: effect._zoomHalfCompleted,
                            iterations: 5,
                            delay: 50,
                            scope: this,
                            reverse : true}).add({
                            iteratedCallback: effect._zoomIterated,
                            completedCallback: effect._zoomCompleted,
                            iterations: 5,
                            delay: 50,
                            scope: this}).run();
                        break;
            }
            } else {
                this.get('imageNode').set('src', href);
            }

            this.get('imageNode').detach('load', this.center);
            this.get('imageNode').on('load', this.center, this);

        },
        getNavigation : function() {
          // Get navigation position
            var i = 0; // actual index
            // Get actual pagination
            for (var j in this.images) {
                if (this.images[j].src == this.get('active')
                    || this.images[j].rel == this.get('active')) {
                    i = j;
                }
            }
            var prevLink = (i > 0 ? this.images[i - 1].src : null);
            var nextLink = (i < (this.images.length - 1) ? this.images[i * 1 + 1].src
                : null);
            return {prev:prevLink, next: nextLink};
        },
        center : function(){
            if (this.get('imageNode').get('width') < MIN_WIDTH) {
                this.get('imageNode').set('width', MIN_WIDTH);
            }
            if (this.get('imageNode').get('height') < MIN_HEIGHT) {
                this.get('imageNode').set('height', MIN_HEIGHT);
            }
            effect.centerBy(this.get('boundingBox'), this.get('imageNode'));
            this.get('imageNode').removeClass('hidden');
       }

    });

    bsShow.walkThrough = function () {
        // Assigns onclick event for found links
        Y.all('a[rel=blogslideshow]').on('click', function(e){
           e.preventDefault();
           if (e.currentTarget.get('href')) {
                e.preventDefault();
                new bsShow(Y.merge({
                    active: e.currentTarget.get('href')
                }, bsShow.options));
            }
        });
    };
    bsShow.options = null;
    bsShow.init = function (cfg){
        bsShow.options = cfg;
    };
    bsShow.start = function (cfg){
         Y.on("contentready", function() {
            bsShow.options = cfg;
            bsShow.walkThrough();
         }, "body");
    };

   }, '0.0.1', {
    requires: ['widget', 'widget-stack', 'node', 'event']
});


