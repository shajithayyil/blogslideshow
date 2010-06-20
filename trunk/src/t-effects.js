/*
* Transition Effect library
*
* @package tEffects
* @author Dmitry Sheiko
* @version $Revision$
* @license GNU
* @copyright (c) Dmitry Sheiko http://dsheiko.com
*
* Usage examples:
* 
*/
var tEffect =  {
    _delegate : [],
    Util : function(node, scope) {
        var _node = node;       
        return {
            /**
             * Delegate functions of external library
             * @param (object) delegates
             * { isIE : function(){},
             * 
             * }
             */
            delegate : function(delegates) {                
                tEffect._delegate = delegates;
            },
            /**
             * Shortcut for delegated functions
             */
            apply : tEffect._delegate,
            /**
             * Opacity style setter
             * @param string value
             */
            opacity : function(value) {
                if (this.apply.isIe()) {
                    this.apply.setStyle(_node, 'filter', 'alpha(opacity:' + value + ')');
                } else {
                    this.apply.setStyle(_node, 'opacity', value / 100);
                }
            },
            /**
             * Transformation style setter
             * @param string value
             */
            transform : function(value) {
                  this.apply.setStyle(_node, 'webkitTransform', value);
                  this.apply.setStyle(_node, 'MozTransform', value);
            },
            /**
             * Align node to the screen center. When donor specified the node is aligned
             * according to donor size
             * @param HTMLNode donor OPTIONAL
             */
            centerBy : function(donor) {
                 if (undefined === donor) {
                     donor = _node;
                 }
                 
                 this.apply.setStyle(_node, 'left', Math.ceil(document.body.scrollLeft
                        + this.apply.windowWidth()/2
                        - this.apply.get(donor, 'width')/2) + 'px');
                 this.apply.setStyle(_node, 'top', Math.ceil(document.body.scrollTop
                        + this.apply.windowHeight()/2
                        - this.apply.get(donor, 'height')/2) + 'px');
            },
            /**
             * Makes node size the same as donor
             * @param HTMLNode donor
             */
            sizeBy : function(donor) {
                this.apply.setStyle(_node, 'width', this.apply.get(donor, 'width') + 'px');
                this.apply.setStyle(_node, 'height', this.apply.get(donor, 'height') + 'px');
            },
            /**
             * Makes node position the same as donor
             * @param HTMLNode donor
             */
            positionBy : function(donor) {
                this.apply.setStyle(_node, 'top', this.apply.getStyle(donor, "top") + 'px');
                this.apply.setStyle(_node, 'left', this.apply.getStyle(donor, "left") + 'px');
            },
            /**
             * External framework Show function alias
             */
            show : function() {
                this.apply.show(_node);
            },
            /**
             * External framework Hide function alias
             */
            hide : function() {
                this.apply.hide(_node);
            },
            /**
             * External framework setStyle function alias
             * @param (string) property
             * @param (string) value
             */
            setStyle : function(property, value) {
                this.apply.setStyle(_node, property, value);
            },
            /**
             * External framework getStyle function alias
             * @param (string) property
             * @return (string)
             */
            getStyle : function(property) {
                return this.apply.getStyle(_node, property);
            },
            /**
             * External framework set element property function alias
             * @param (string) property
             * @param (string) value
             */
            set : function(property, value) {
                this.apply.set(_node, property, value);
            },
            /**
             * External framework get element property function alias
             * @param (string) property
             * @return (string)
             */
            get : function(property) {
                return this.apply.get(_node, property);
            },
            /**
             * External framework each of child function alias
             * @param (function) callback
             * @param (object) scope
             */
            eachChild : function(callback, scope) {
                return this.apply.eachChild(_node, callback, scope);
            }
        }
    }
};
(function(tEffect) {
    var $ = tEffect.Util;
    /**
     * Fade effect
     */
    tEffect._fadeStarted = function() {
        $(this.get('spriteNode')).show();
        $(this.get('spriteNode')).opacity(0);
        $(this.get('spriteNode')).set('src', this.get('active'));
        $(this.get('spriteNode')).centerBy(this.get('spriteNode'));
    };
    tEffect._fadeIterated = function(counter, number) {
       $(this.get('spriteNode')).opacity(counter * number * 10);
    };
    tEffect._fadeCompleted = function() {
        $(this.get('imageNode')).set('src', this.get('active'));
        $(this.get('spriteNode')).opacity(100);
        $(this.get('boundingBox')).centerBy(this.get('imageNode'));
        $(this.get('spriteNode')).hide();
    };
     /**
     * Jalousie effect
     */
    tEffect._jalousieStarted = function() {
        $(this.get('spriteNode')).set('src', this.get('active'));
        $(this.get('eOverlayNode')).sizeBy(this.get('spriteNode'));
        $(this.get('eOverlayNode')).centerBy(this.get('spriteNode'));
        $(this.get('eOverlayNode')).show();
        var maxW = $(this.get('spriteNode')).get('width');
        $(this.get('eOverlayNode')).eachChild(function(i, node, scope){
                $(node).setStyle('backgroundImage', 'url(' + scope.get('active') + ')');
                $(node).setStyle('backgroundPosition', '-' + Math.ceil(i * maxW / 10) + 'px 0px');
                $(node).transform('scale(0.1, 1)');
        }, this);
    };
    tEffect._jalousieIterated = function(counter, number) {
        $(this.get('eOverlayNode')).eachChild(function(i, node, scope){
            $(node).transform('scale(' + (counter / number) + ', 1)');
        }, this);
        $(this.get('imageNode')).opacity((number - counter) * number * 10);
    };
    tEffect._jalousieCompleted = function() {
        $(this.get('imageNode')).set('src', this.get('active'));
        $(this.get('imageNode')).opacity(100);
        $(this.get('boundingBox')).positionBy(this.get('eOverlayNode'));
        $(this.get('eOverlayNode')).hide();
    };
     /**
     * Ladder effect
     */
    tEffect._ladderStarted = function() {
        $(this.get('boundingBox')).setStyle('background',
            'url(' + $(this.get('imageNode')).get('src') + ') center center no-repeat');
        $(this.get('spriteNode')).set('src', this.get('active'));
        $(this.get('boundingBox')).centerBy(this.get('spriteNode'));
        $(this.get('boundingBox')).sizeBy(this.get('spriteNode'));
        $(this.get('imageNode')).set('src', "");
        $(this.get('eOverlayNode')).sizeBy(this.get('spriteNode'));
        $(this.get('eOverlayNode')).centerBy(this.get('spriteNode'));
        $(this.get('eOverlayNode')).show();
    };
    tEffect._ladderIterated = function(counter, number) {
        var maxH = $(this.get('spriteNode')).get("height");
        var maxW = $(this.get('spriteNode')).get("width");
        $(this.get('eOverlayNode')).eachChild(function(i, node, scope){
            var h = Math.ceil((counter-1) * maxH / number - ( i * maxH / 10));
            if (h > maxH) {
                h = maxH;
            }
            if (h < 0) {
                h = 0;
            }
            $(node).setStyle('backgroundImage', 'url(' + scope.get('active') + ')');
            $(node).setStyle('backgroundPosition', '-' + Math.ceil(i*maxW/10) + 'px ' + h + 'px');
        }, this);
    };
    tEffect._ladderCompleted = function() {
        $(this.get('imageNode')).set('src', this.get('active'));
        $(this.get('boundingBox')).positionBy(this.get('eOverlayNode'));
        $(this.get('eOverlayNode')).hide();
        $(this.get('boundingBox')).setStyle('background', "");
        $(this.get('eOverlayNode')).eachChild(function(i, node, scope){
            $(node).setStyle('background', '');
        }, this);
    };
    /**
    * Scroll left effect
    */
    tEffect._scrollStarted = function() {
        $(this.get('boundingBox')).setStyle('background',
            'url(' + $(this.get('imageNode')).get('src') + ') center center no-repeat');
        $(this.get('spriteNode')).set('src', this.get('active'));
        $(this.get('boundingBox')).centerBy(this.get('spriteNode'));
        $(this.get('boundingBox')).sizeBy(this.get('spriteNode'));
        $(this.get('imageNode')).set('src', this.get('active'));
        $(this.get('imageNode')).setStyle('left', $(this.get('spriteNode')).get('width') + 'px');
        $(this.get('boundingBox')).setStyle('overflow', 'hidden');
        $(this.get('imageNode')).setStyle('position', 'relative');
    };
    tEffect._scrollIterated = function(counter, number) {
        $(this.get('imageNode')).setStyle('left', Math.ceil((counter - 1)
            * $(this.get('spriteNode')).get('width') / number) + 'px');
    };
    tEffect._scrollCompleted = function() {
        $(this.get('imageNode')).setStyle('left', "0px");
        $(this.get('boundingBox')).setStyle('width', 'auto');
        $(this.get('boundingBox')).setStyle('height', 'auto');
        $(this.get('boundingBox')).setStyle('overflow', '');
        $(this.get('imageNode')).setStyle('position', '');
        $(this.get('boundingBox')).setStyle('background', '');
    };
    /**
    * Rotate effect
    */
    tEffect._rotateStarted = function() {
        $(this.get('boundingBox')).setStyle('background',
            'url(' + $(this.get('imageNode')).get('src') + ') center center no-repeat');
        $(this.get('spriteNode')).set('src', this.get('active'));
        $(this.get('boundingBox')).centerBy(this.get('spriteNode'));
        $(this.get('boundingBox')).sizeBy(this.get('spriteNode'));
        $(this.get('imageNode')).set('src', this.get('active'));

    };
    tEffect._rotateIterated = function(counter, number) {
        $(this.get('imageNode')).transform(
            'rotate(' + (counter * 45) + 'deg) scale('+ (counter / number) +')');
    };
    tEffect._rotateCompleted = function() {
        $(this.get('imageNode')).transform('rotate(0deg) scale(1)');
        $(this.get('boundingBox')).setStyle('width', 'auto');
        $(this.get('boundingBox')).setStyle('height', 'auto');
        $(this.get('boundingBox')).setStyle('background', '');
    };
     /**
    * Zoom effect
    */
    tEffect._zoomStarted = function() {
        $(this.get('spriteNode')).set('src', this.get('active'));
    };
    tEffect._zoomHalfCompleted = function() {
        $(this.get('boundingBox')).centerBy(this.get('spriteNode'));
        $(this.get('boundingBox')).sizeBy(this.get('spriteNode'));
        $(this.get('imageNode')).set('src', this.get('active'));
    };
    tEffect._zoomIterated = function(counter, number) {
        $(this.get('imageNode')).transform('scale('+ (counter / number) +')');
    };
    tEffect._zoomCompleted = function() {
        $(this.get('boundingBox')).setStyle('width', 'auto');
        $(this.get('boundingBox')).setStyle('height', 'auto');
        $(this.get('imageNode')).transform('scale(1)');
    };
})(tEffect);
