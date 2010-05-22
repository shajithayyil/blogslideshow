/*
* Blog Slide Show
* YUI3 Port
*
* @package blogslideshow
* @author $Author: sheiko $  
* @version $Id: blogslideshow.js, v 2.0 $
* @license GNU
* @copyright (c) Dmitry Sheiko http://dsheiko.com
*/ 
YUI.add('bsShow', function(Y){

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
         * Fade effect
         */
        _fadeStarted : function(scope) {
            scope.get('boundingBox').setStyle('background'
                , 'url(' + scope.get('imageNode').get('src') + ') no-repeat');
            scope.get('imageNode').set('src', scope.get('active'));
        },
        _fadeIterated : function(counter, number, scope) {
            scope.get('imageNode').setStyle('filter', 'alpha(opacity:' + counter * number * 10 + ')');
            scope.get('imageNode').setStyle('opacity', '0.' + counter * number);
        },
        _fadeCompleted : function(scope) {
            scope.get('imageNode').setStyle('filter', 'alpha(opacity:100)');
            scope.get('imageNode').setStyle('opacity', '1');
            scope.center();
        },
       /**
        * Scroll left effect
        */
        _scrollStarted : function(scope) {
            scope.get('boundingBox').setStyle('background'
                , 'url(' + scope.get('imageNode').get('src') + ') no-repeat');
            effect.originalWidth = scope.get('imageNode').get('width');
            scope.get('boundingBox').setStyle('width', effect.originalWidth + "px");
            scope.get('boundingBox').setStyle('height', scope.get('imageNode').get('height') + "px");
            scope.get('imageNode').set('src', scope.get('active'));
            scope.get('boundingBox').setStyle('overflow', 'hidden');
            scope.get('imageNode').setStyle('position', 'relative');
        },
        _scrollIterated : function(counter, number, scope) {
            scope.get('imageNode').setStyle('left', (4 - counter) * (effect.originalWidth/number) + 'px');
        },
        _scrollCompleted : function(scope) {
            scope.get('imageNode').setStyle('left', "0px");
            scope.get('boundingBox').setStyle('width', 'auto');
            scope.get('boundingBox').setStyle('height', 'auto');
            scope.get('boundingBox').setStyle('overflow', '');
            scope.get('imageNode').setStyle('position', '');
            scope.get('boundingBox').setStyle('background', '');
            scope.center();
        },
        /**
        * Rotate effect
        */
        _rotateStarted : function(scope) {
            scope.get('boundingBox').setStyle('width', scope.get('imageNode').get('width') + "px");
            scope.get('boundingBox').setStyle('height', scope.get('imageNode').get('height') + "px");
            scope.get('spriteNode').removeClass('hidden');
            scope.get('spriteNode').set('src', scope.get('active'));
            scope.get('spriteNode').set('width', scope.get('imageNode').get('width'));
            scope.get('spriteNode').set('height', scope.get('imageNode').get('height'));
        },
        _rotateIterated : function(counter, number, scope) {
            var transformation = 'rotate(' + (counter * 45) + 'deg) scale('+ (counter / number) +')';
            scope.get('spriteNode').setStyle('webkitTransform', transformation);
            scope.get('spriteNode').setStyle('MozTransform', transformation);
        },
        _rotateCompleted : function(scope) {
            scope.get('spriteNode').addClass('hidden');
            scope.get('boundingBox').setStyle('width', 'auto');
            scope.get('boundingBox').setStyle('height', 'auto');
            scope.get('imageNode').set('src', scope.get('active'));
            scope.get('imageNode').detach('load', scope.center).on('load', scope.center, scope);
        },
        /**
        * CurtanX effect
        */
        _curtanXStarted : function(scope) {
            effect.originalWidth = scope.get('imageNode').get('width');
            effect.originalHeight = scope.get('imageNode').get('height');
            scope.get('boundingBox').setStyle('width', scope.get('imageNode').get('width') + "px");
            scope.get('boundingBox').setStyle('height', scope.get('imageNode').get('height') + "px");
            scope.get('spriteNode').set('src', scope.get('imageNode').get('src'));
            scope.get('spriteNode').removeClass('hidden');
            scope.get('imageNode').addClass('hidden');
        },
        _curtanXIterated : function(counter, number, scope) {
            scope.get('spriteNode').set('width', Math.ceil(counter * effect.originalWidth / number ));
            scope.get('spriteNode').set('height', effect.originalHeight);
        },
        _curtanXHalfCompleted : function(scope) {
            scope.get('spriteNode').set('src', scope.get('active'));
        },
        _curtanXCompleted : function(scope) {
            scope.get('spriteNode').addClass('hidden');
            scope.get('imageNode').removeClass('hidden');
            scope.get('boundingBox').setStyle('width', 'auto');
            scope.get('boundingBox').setStyle('height', 'auto');
            scope.get('imageNode').set('src', scope.get('active'));
            scope.get('imageNode').detach('load', scope.center).on('load', scope.center, scope);
        },
         /**
        * Zoom effect
        */
        _zoomStarted : function(scope) {
            effect.originalWidth = scope.get('imageNode').get('width');
            effect.originalHeight = scope.get('imageNode').get('height');
            scope.get('boundingBox').setStyle('width', scope.get('imageNode').get('width') + "px");
            scope.get('boundingBox').setStyle('height', scope.get('imageNode').get('height') + "px");
            scope.get('spriteNode').set('src', scope.get('imageNode').get('src'));
            scope.get('spriteNode').removeClass('hidden');
            scope.get('imageNode').addClass('hidden');
            scope.get('spriteNode').set('width', effect.originalWidth);
            scope.get('spriteNode').set('height', effect.originalHeight);
        },
        _zoomHalfCompleted : function(scope) {
            scope.get('spriteNode').set('src', scope.get('active'));
            scope.get('spriteNode').set('width', effect.originalWidth);
            scope.get('spriteNode').set('height', effect.originalHeight);
        },
        _zoomIterated : function(counter, number, scope) {
            var transformation = 'scale('+ (counter / number) +')';
            scope.get('spriteNode').setStyle('webkitTransform', transformation);
            scope.get('spriteNode').setStyle('MozTransform', transformation);
        },
        _zoomCompleted : function(scope) {
            scope.get('spriteNode').addClass('hidden');
            scope.get('imageNode').removeClass('hidden');
            scope.get('boundingBox').setStyle('width', 'auto');
            scope.get('boundingBox').setStyle('height', 'auto');
            scope.get('imageNode').set('src', scope.get('active'));
            scope.get('imageNode').detach('load', scope.center).on('load', scope.center, scope);
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
            spriteNode: null // Sprite which is used for visual effects
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
            imageNode: "#ss-image",
            /**
             * @type {YUI.Node}
             */
            spriteNode: "#ss-sprite"
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
        CONTENT_TEMPLATE: '<img id="ss-sprite" class="hidden" src="" />' +
                '<img id="ss-image" src="" class="hidden" />' +
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
            Y.one('body').prepend('<div id="ss-mask"><!--  --></div>');
            this.set('maskNode', Y.one('#ss-mask'));
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
            Y.one(document).on('keydown', this._onKeypress, this);
        },
        // Event handlers
        _onKeypress : function(e) {
            // Next
            if (39 == e.keyCode) {
                this._onClickNext(e);
            }
            // Previous
            if (37 == e.keyCode) {
                this._onClickPrev(e);
            }
        },
         _onClickClose : function(e) {
            e.preventDefault();
            this.get('maskNode').remove();
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
        // Callbacks
        _fadeCallback : function() {
            this.get('imageNode').setStyle('filter', 'alpha(opacity:'+ (counter * 30) + ')');
            this.get('imageNode').setStyle('opacity', '0.'+ (counter * 30));
            counter++;
        },
        _fadeCompleteCallback : function() {
            this.get('imageNode').setStyle('filter', 'alpha(opacity:100)');
            this.get('imageNode').setStyle('opacity', '1');
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
                case 'scroll' :
                    aQueue.add({
                        startedCallback: effect._scrollStarted,
                        iteratedCallback: effect._scrollIterated,
                        completedCallback: effect._scrollCompleted,
                        iterations: 3,
                        delay: 150,
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
                case 'curtanX' :
                    aQueue.add({
                        startedCallback: effect._curtanXStarted,
                        iteratedCallback: effect._curtanXIterated,
                        completedCallback: effect._curtanXHalfCompleted,
                        iterations: 5,
                        delay: 150,
                        scope: this,
                        reverse : true}).add({
                        iteratedCallback: effect._curtanXIterated,
                        completedCallback: effect._curtanXCompleted,
                        iterations: 5,
                        delay: 150,
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
            var imgNode = this.get('imageNode');
            var box = this.get('boundingBox');
            
            if (imgNode.get('width') < 300) {
                imgNode.setStyle('width', '300px');
            }
            if (imgNode.get('height') < 300) {
                imgNode.setStyle('height', '300px');
            }
                        
            box.setStyle("left",  Math.ceil(document.body.scrollLeft 
                + Y.one('body').get('winWidth') / 2 - imgNode.get('width') / 2) +'px' );
            box.setStyle("top",  Math.ceil(document.body.scrollTop 
                + Y.one('body').get('winHeight') / 2 - imgNode.get('height') / 2) +'px' );

            imgNode.removeClass('hidden');
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
    requires: ['widget', 'widget-stack', 'node', 'event', 'async-queue']
});


