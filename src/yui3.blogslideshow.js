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
* 
* Dependencies:
*   tEffect (t-tEffect.js)
*   aQueue (a-queue.js)
*
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
            freezeScreenNode : null, // Mask frezzeing the screen
            prevBtnNode : null, // To previous image button
            nextBtnNode : null, // To next image button
            closeBtnNode : null, // Close overlay button
            imageNode : null, // Image object
            overlayImageNode: null, // Sprite which is used for visual effects
            overlayMaskNode: null
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
            this.checkDependencies();
            this.delegateFramework();
        },
        /**
         * Checks if whether dependencies are loaded
         */
        checkDependencies : function() {
            if (undefined == tEffect) {
                throw "Cannot find dependency - Transiton Effect library";
            }
            if (undefined == aQueue) {
                throw "Cannot find dependency - Asynchronous Queue library";
            }
        },
        /**
         * Delegate DOM manipulation function of the framework to Transition Effect library
         */
        delegateFramework : function() {
            tEffect.Util().delegate({
                isIe: function(){
                    return Y.UA.ie;
                },
                setStyle : function(node, property, value) {
                    Y.one(node).setStyle(property, value);
                },
                getStyle : function(node, property) {
                    return Y.one(node).getStyle(property).replace(/px$/, "");
                },
                transform : function(node, value) {
                    node.setStyle('webkitTransform', value);
                    node.setStyle('MozTransform', value);
                },
                windowWidth : function() {
                    return Y.one('body').get('winWidth');
                },
                windowHeight : function() {
                    return Y.one('body').get('winHeight');
                },
                show : function(node) {
                    node.removeClass('hidden');
                },
                hide : function(node) {
                    node.addClass('hidden');
                },
                set : function(node, property, value) {
                    Y.one(node).set(property, value);
                },
                get : function(node, property) {
                    return Y.one(node).get(property);
                },
                eachChild : function(node, callback, scope) {
                    node.get('children').each(function(node, i){
                        callback(i, node, scope);
                    }, this);
                }
             });
        },
        /**
         *
         * @return void
         */
        renderUI: function(){
            Y.one('body').prepend(MASK_TPL);
            Y.one('body').append(SPRITE_TPL);
            Y.one('body').append(EOVERLAY_TPL);
            this.set('freezeScreenNode', Y.one('#ss-mask'));
            this.set('overlayImageNode', Y.one('#ss-sprite'));
            this.set('overlayMaskNode', Y.one('#ss-effect-overlay'));
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

            this.get('freezeScreenNode').on('click', this._onClickClose, this);
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
            this.get('freezeScreenNode').remove();
            this.get('overlayImageNode').remove();
            this.get('overlayMaskNode').remove();
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
                            startedCallback: tEffect._fadeStarted,
                            iteratedCallback: tEffect._fadeIterated,
                            completedCallback: tEffect._fadeCompleted,
                            iterations: 3,
                            delay: 100,
                            scope: this}).run();
                        break;
                    case 'jalousie' :
                        aQueue.add({
                            startedCallback: tEffect._jalousieStarted,
                            iteratedCallback: tEffect._jalousieIterated,
                            completedCallback: tEffect._jalousieCompleted,
                            iterations: 5,
                            delay: 50,
                            scope: this}).run();
                        break;
                    case 'ladder' :
                        aQueue.add({
                            startedCallback: tEffect._ladderStarted,
                            iteratedCallback: tEffect._ladderIterated,
                            completedCallback: tEffect._ladderCompleted,
                            iterations: 20,
                            delay: 50,
                            reverse: true,
                            scope: this}).run();
                        break;
                    case 'scroll' :
                        aQueue.add({
                            startedCallback: tEffect._scrollStarted,
                            iteratedCallback: tEffect._scrollIterated,
                            completedCallback: tEffect._scrollCompleted,
                            iterations: 5,
                            delay: 150,
                            reverse: true,
                            scope: this}).run();
                        break;
                     case 'rotate' :
                        aQueue.add({
                            startedCallback: tEffect._rotateStarted,
                            iteratedCallback: tEffect._rotateIterated,
                            completedCallback: tEffect._rotateCompleted,
                            iterations: 10,
                            delay: 50,
                            scope: this}).run();
                        break;
                    case 'zoom' :
                        aQueue.add({
                            startedCallback: tEffect._zoomStarted,
                            iteratedCallback: tEffect._zoomIterated,
                            completedCallback: tEffect._zoomHalfCompleted,
                            iterations: 5,
                            delay: 50,
                            scope: this,
                            reverse : true}).add({
                            iteratedCallback: tEffect._zoomIterated,
                            completedCallback: tEffect._zoomCompleted,
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
            tEffect.Util(this.get('boundingBox')).centerBy(this.get('imageNode'));
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


