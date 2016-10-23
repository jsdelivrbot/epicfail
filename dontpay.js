var cvpHandlers = {
        canvasClickHandler: null,
        videoTimeUpdateHandler: null,
        videoCanPlayHandler: null,
        windowResizeHandler: null
    },
    CanvasVideoPlayer = function(a) {
        var b;
        this.options = {
            framesPerSecond: 25,
            hideVideo: !0,
            autoplay: !1,
            audio: !1,
            timelineSelector: !1,
            resetOnLastFrame: !0,
            pauseOnClick: !1
        };
        for (b in a) this.options[b] = a[b];
        if (this._eventType = ["mute", "time", "complete", "skip", "start"], this._registeredEvent = {}, this._eventType.forEach(function(a) {
                this._registeredEvent[a] = []
            }, this), this.video = document.querySelector(this.options.videoSelector), this.canvas = document.querySelector(this.options.canvasSelector), this.timeline = document.querySelector(this.options.timelineSelector), this.timelinePassed = document.querySelector(this.options.timelineSelector + "> div"), !this.options.videoSelector || !this.video) return void console.error('No "videoSelector" property, or the element is not found');
        if (!this.options.canvasSelector || !this.canvas) return void console.error('No "canvasSelector" property, or the element is not found');
        if (this.options.timelineSelector && !this.timeline) return void console.error('Element for the "timelineSelector" selector not found');
        if (this.options.timelineSelector && !this.timelinePassed) return void console.error('Element for the "timelinePassed" not found');
        if (this.options.audio) {
            if ("string" == typeof this.options.audio) {
                if (this.audio = document.querySelectorAll(this.options.audio)[0], !this.audio) return void console.error('Element for the "audio" not found')
            } else this.audio = document.createElement("audio"), this.audio.innerHTML = this.video.innerHTML, this.video.parentNode.insertBefore(this.audio, this.video), this.audio.load();
            var c = /iPad|iPhone|iPod/.test(navigator.platform);
            c && (this.options.autoplay = !1)
        }
        this.ctx = this.canvas.getContext("2d"), this.playing = !1, this.resizeTimeoutReference = !1, this.RESIZE_TIMEOUT = 1e3, this.init(), this.bind()
    };
CanvasVideoPlayer.prototype.init = function() {
    this.video.load(), this.setCanvasSize(), this.options.hideVideo && (this.video.style.display = "none")
}, CanvasVideoPlayer.prototype.getOffset = function(a) {
    var b, c, d;
    if (a) return c = a.getBoundingClientRect(), c.width || c.height || a.getClientRects().length ? (d = a.ownerDocument, b = d.documentElement, {
        top: c.top + window.pageYOffset - b.clientTop,
        left: c.left + window.pageXOffset - b.clientLeft
    }) : void 0
}, CanvasVideoPlayer.prototype.jumpTo = function(a) {
    this.video.currentTime = this.video.duration * a, this.options.audio && (this.audio.currentTime = this.audio.duration * a)
}, CanvasVideoPlayer.prototype.bind = function() {
    var a = this;
    a.pauseOnClick && this.canvas.addEventListener("click", cvpHandlers.canvasClickHandler = function() {
        a.playPause()
    }), this.video.addEventListener("timeupdate", cvpHandlers.videoTimeUpdateHandler = function() {
        a.drawFrame(), a.options.timelineSelector && a.updateTimeline()
    }), this.video.addEventListener("canplay", cvpHandlers.videoCanPlayHandler = function() {
        a.drawFrame()
    }), this.video.readyState >= 2 && a.drawFrame(), a.options.autoplay && a.play(), a.options.timelineSelector && this.timeline.addEventListener("click", function(b) {
        var c = b.clientX - a.getOffset(a.canvas).left,
            d = c / a.timeline.offsetWidth;
        a.jumpTo(d)
    }), window.addEventListener("resize", cvpHandlers.windowResizeHandler = function() {
        clearTimeout(a.resizeTimeoutReference), a.resizeTimeoutReference = setTimeout(function() {
            a.setCanvasSize(), a.drawFrame()
        }, a.RESIZE_TIMEOUT)
    }), this.unbind = function() {
        this.canvas.removeEventListener("click", cvpHandlers.canvasClickHandler), this.video.removeEventListener("timeupdate", cvpHandlers.videoTimeUpdateHandler), this.video.removeEventListener("canplay", cvpHandlers.videoCanPlayHandler), window.removeEventListener("resize", cvpHandlers.windowResizeHandler), this.options.audio && this.audio.parentNode.removeChild(this.audio)
    }
}, CanvasVideoPlayer.prototype.updateTimeline = function() {
    var a = (100 * this.video.currentTime / this.video.duration).toFixed(2);
    this.timelinePassed.style.width = a + "%"
}, CanvasVideoPlayer.prototype.setCanvasSize = function() {
    this.width = this.canvas.clientWidth, this.height = this.canvas.clientHeight, this.canvas.setAttribute("width", this.width), this.canvas.setAttribute("height", this.height)
}, CanvasVideoPlayer.prototype.play = function() {
    this.setCanvasSize(), this.lastTime = Date.now(), this.playing = !0, this.started || (console.log("start"), this._emitEvent("start")), this.started = !0, this.loop(), this.options.audio && (this.audio.currentTime = this.video.currentTime, this.audio.play())
}, CanvasVideoPlayer.prototype.pause = function() {
    this.playing = !1, this.options.audio && this.audio.pause()
}, CanvasVideoPlayer.prototype.playPause = function() {
    this.playing ? this.pause() : this.play()
}, CanvasVideoPlayer.prototype.setMute = function(a) {
    a ? (this.audio.pause(), this._emitEvent("mute", [{
        mute: !0
    }])) : (this.audio.play(), this._emitEvent("mute", [{
        mute: !1
    }]))
}, CanvasVideoPlayer.prototype.on = function(a, b) {
    this._registeredEvent[a] && this._registeredEvent[a].push(b)
}, CanvasVideoPlayer.prototype._emitEvent = function(a, b) {
    this._registeredEvent[a] && this._registeredEvent[a].forEach(function(a) {
        a.apply(null, b)
    })
}, CanvasVideoPlayer.prototype.loop = function() {
    var a = this,
        b = Date.now(),
        c = (b - this.lastTime) / 1e3;
    c >= 1 / this.options.framesPerSecond && (this.video.currentTime = this.video.currentTime + c, this.lastTime = b, this.audio && Math.abs(this.audio.currentTime - this.video.currentTime) > .3 && (this.audio.currentTime = this.video.currentTime)), this.video.currentTime >= this.video.duration && (this._emitEvent("complete"), this.playing = !1, this.options.resetOnLastFrame === !0 && (this.video.currentTime = 0)), this._emitEvent("time", [{
        duration: this.video.duration,
        position: this.video.currentTime
    }]), this.playing ? this.animationFrame = requestAnimationFrame(function() {
        a.loop()
    }) : cancelAnimationFrame(this.animationFrame)
}, CanvasVideoPlayer.prototype.drawFrame = function() {
    this.ctx.drawImage(this.video, 0, 0, this.width, this.height)
};
var VideoPlayer = function(a) {
    this.options = {};
    for (var b in a) this.options[b] = a[b];
    return this.video = document.querySelector(this.options.videoSelector), this.options.videoSelector && this.video ? (this._eventType = ["start", "mute", "time", "complete"], this._registeredEvent = {}, this._eventType.forEach(function(a) {
        this._registeredEvent[a] = []
    }, this), this.playing = !1, this.init(), void this.bind()) : void console.error('No "videoSelector" property, or the element is not found')
};
VideoPlayer.prototype.init = function() {}, VideoPlayer.prototype.bind = function() {
        this.video.addEventListener("timeupdate", function() {
            this._emitEvent("time", [{
                duration: this.video.duration,
                position: this.video.currentTime
            }])
        }.bind(this)), this.video.addEventListener("ended", function() {
            this._emitEvent("complete")
        }.bind(this)), this.video.addEventListener("loadeddata", function() {
            this._emitEvent("start")
        }.bind(this))
    }, VideoPlayer.prototype.getState = function() {
        return this.playing ? "playing" : "paused"
    }, VideoPlayer.prototype.play = function() {
        this.playing || (this.playing = !0, this.started = !0, this.video.play(), this._emitEvent("play"))
    }, VideoPlayer.prototype.pause = function() {
        this.playing && (this.playing = !1, this.video.pause(), this._emitEvent("pause"))
    }, VideoPlayer.prototype.setMute = function(a) {
        this.video.muted = !!a, this._emitEvent("mute", [{
            mute: !!a
        }])
    }, VideoPlayer.prototype.on = function(a, b) {
        this._registeredEvent[a] && this._registeredEvent[a].push(b)
    }, VideoPlayer.prototype._emitEvent = function(a, b) {
        this._registeredEvent[a] && this._registeredEvent[a].forEach(function(a) {
            a.apply(null, b)
        })
    }, ! function(a) {
        var b = /iPhone/i,
            c = /iPod/i,
            d = /iPad/i,
            e = /(?=.*\bAndroid\b)(?=.*\bMobile\b)/i,
            f = /Android/i,
            g = /(?=.*\bAndroid\b)(?=.*\bSD4930UR\b)/i,
            h = /(?=.*\bAndroid\b)(?=.*\b(?:KFOT|KFTT|KFJWI|KFJWA|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA|KFARWI|KFASWI|KFSAWI|KFSAWA)\b)/i,
            i = /IEMobile/i,
            j = /(?=.*\bWindows\b)(?=.*\bARM\b)/i,
            k = /BlackBerry/i,
            l = /BB10/i,
            m = /Opera Mini/i,
            n = /(CriOS|Chrome)(?=.*\bMobile\b)/i,
            o = /(?=.*\bFirefox\b)(?=.*\bMobile\b)/i,
            p = new RegExp("(?:Nexus 7|BNTV250|Kindle Fire|Silk|GT-P1000)", "i"),
            q = function(a, b) {
                return a.test(b)
            },
            r = function(a) {
                var r = a || navigator.userAgent,
                    s = r.split("[FBAN");
                return "undefined" != typeof s[1] && (r = s[0]), s = r.split("Twitter"), "undefined" != typeof s[1] && (r = s[0]), this.apple = {
                    phone: q(b, r),
                    ipod: q(c, r),
                    tablet: !q(b, r) && q(d, r),
                    device: q(b, r) || q(c, r) || q(d, r)
                }, this.amazon = {
                    phone: q(g, r),
                    tablet: !q(g, r) && q(h, r),
                    device: q(g, r) || q(h, r)
                }, this.android = {
                    phone: q(g, r) || q(e, r),
                    tablet: !q(g, r) && !q(e, r) && (q(h, r) || q(f, r)),
                    device: q(g, r) || q(h, r) || q(e, r) || q(f, r)
                }, this.windows = {
                    phone: q(i, r),
                    tablet: q(j, r),
                    device: q(i, r) || q(j, r)
                }, this.other = {
                    blackberry: q(k, r),
                    blackberry10: q(l, r),
                    opera: q(m, r),
                    firefox: q(o, r),
                    chrome: q(n, r),
                    device: q(k, r) || q(l, r) || q(m, r) || q(o, r) || q(n, r)
                }, this.seven_inch = q(p, r), this.any = this.apple.device || this.android.device || this.windows.device || this.other.device || this.seven_inch, this.phone = this.apple.phone || this.android.phone || this.windows.phone, this.tablet = this.apple.tablet || this.android.tablet || this.windows.tablet, "undefined" == typeof window ? this : void 0
            },
            s = function() {
                var a = new r;
                return a.Class = r, a
            };
        "undefined" != typeof module && module.exports && "undefined" == typeof window ? module.exports = r : "undefined" != typeof module && module.exports && "undefined" != typeof window ? module.exports = s() : "function" == typeof define && define.amd ? define("isMobile", [], a.isMobile = s()) : a.isMobile = s()
    }(this), ! function(a, b) {
        "object" == typeof module && "object" == typeof module.exports ? module.exports = a.document ? b(a, !0) : function(a) {
            if (!a.document) throw new Error("jQuery requires a window with a document");
            return b(a)
        } : b(a)
    }("undefined" != typeof window ? window : this, function(a, b) {
        function c(a) {
            var b = !!a && "length" in a && a.length,
                c = fa.type(a);
            return "function" === c || fa.isWindow(a) ? !1 : "array" === c || 0 === b || "number" == typeof b && b > 0 && b - 1 in a
        }

        function d(a, b, c) {
            if (fa.isFunction(b)) return fa.grep(a, function(a, d) {
                return !!b.call(a, d, a) !== c
            });
            if (b.nodeType) return fa.grep(a, function(a) {
                return a === b !== c
            });
            if ("string" == typeof b) {
                if (pa.test(b)) return fa.filter(b, a, c);
                b = fa.filter(b, a)
            }
            return fa.grep(a, function(a) {
                return _.call(b, a) > -1 !== c
            })
        }

        function e(a, b) {
            for (;
                (a = a[b]) && 1 !== a.nodeType;);
            return a
        }

        function f(a) {
            var b = {};
            return fa.each(a.match(va) || [], function(a, c) {
                b[c] = !0
            }), b
        }

        function g() {
            X.removeEventListener("DOMContentLoaded", g), a.removeEventListener("load", g), fa.ready()
        }

        function h() {
            this.expando = fa.expando + h.uid++
        }

        function i(a, b, c) {
            var d;
            if (void 0 === c && 1 === a.nodeType)
                if (d = "data-" + b.replace(Ca, "-$&").toLowerCase(), c = a.getAttribute(d), "string" == typeof c) {
                    try {
                        c = "true" === c ? !0 : "false" === c ? !1 : "null" === c ? null : +c + "" === c ? +c : Ba.test(c) ? fa.parseJSON(c) : c
                    } catch (e) {}
                    Aa.set(a, b, c)
                } else c = void 0;
            return c
        }

        function j(a, b, c, d) {
            var e, f = 1,
                g = 20,
                h = d ? function() {
                    return d.cur()
                } : function() {
                    return fa.css(a, b, "")
                },
                i = h(),
                j = c && c[3] || (fa.cssNumber[b] ? "" : "px"),
                k = (fa.cssNumber[b] || "px" !== j && +i) && Ea.exec(fa.css(a, b));
            if (k && k[3] !== j) {
                j = j || k[3], c = c || [], k = +i || 1;
                do f = f || ".5", k /= f, fa.style(a, b, k + j); while (f !== (f = h() / i) && 1 !== f && --g)
            }
            return c && (k = +k || +i || 0, e = c[1] ? k + (c[1] + 1) * c[2] : +c[2], d && (d.unit = j, d.start = k, d.end = e)), e
        }

        function k(a, b) {
            var c = "undefined" != typeof a.getElementsByTagName ? a.getElementsByTagName(b || "*") : "undefined" != typeof a.querySelectorAll ? a.querySelectorAll(b || "*") : [];
            return void 0 === b || b && fa.nodeName(a, b) ? fa.merge([a], c) : c
        }

        function l(a, b) {
            for (var c = 0, d = a.length; d > c; c++) za.set(a[c], "globalEval", !b || za.get(b[c], "globalEval"))
        }

        function m(a, b, c, d, e) {
            for (var f, g, h, i, j, m, n = b.createDocumentFragment(), o = [], p = 0, q = a.length; q > p; p++)
                if (f = a[p], f || 0 === f)
                    if ("object" === fa.type(f)) fa.merge(o, f.nodeType ? [f] : f);
                    else if (La.test(f)) {
                for (g = g || n.appendChild(b.createElement("div")), h = (Ia.exec(f) || ["", ""])[1].toLowerCase(), i = Ka[h] || Ka._default, g.innerHTML = i[1] + fa.htmlPrefilter(f) + i[2], m = i[0]; m--;) g = g.lastChild;
                fa.merge(o, g.childNodes), g = n.firstChild, g.textContent = ""
            } else o.push(b.createTextNode(f));
            for (n.textContent = "", p = 0; f = o[p++];)
                if (d && fa.inArray(f, d) > -1) e && e.push(f);
                else if (j = fa.contains(f.ownerDocument, f), g = k(n.appendChild(f), "script"), j && l(g), c)
                for (m = 0; f = g[m++];) Ja.test(f.type || "") && c.push(f);
            return n
        }

        function n() {
            return !0
        }

        function o() {
            return !1
        }

        function p() {
            try {
                return X.activeElement
            } catch (a) {}
        }

        function q(a, b, c, d, e, f) {
            var g, h;
            if ("object" == typeof b) {
                "string" != typeof c && (d = d || c, c = void 0);
                for (h in b) q(a, h, c, d, b[h], f);
                return a
            }
            if (null == d && null == e ? (e = c, d = c = void 0) : null == e && ("string" == typeof c ? (e = d, d = void 0) : (e = d, d = c, c = void 0)), e === !1) e = o;
            else if (!e) return this;
            return 1 === f && (g = e, e = function(a) {
                return fa().off(a), g.apply(this, arguments)
            }, e.guid = g.guid || (g.guid = fa.guid++)), a.each(function() {
                fa.event.add(this, b, e, d, c)
            })
        }

        function r(a, b) {
            return fa.nodeName(a, "table") && fa.nodeName(11 !== b.nodeType ? b : b.firstChild, "tr") ? a.getElementsByTagName("tbody")[0] || a : a
        }

        function s(a) {
            return a.type = (null !== a.getAttribute("type")) + "/" + a.type, a
        }

        function t(a) {
            var b = Sa.exec(a.type);
            return b ? a.type = b[1] : a.removeAttribute("type"), a
        }

        function u(a, b) {
            var c, d, e, f, g, h, i, j;
            if (1 === b.nodeType) {
                if (za.hasData(a) && (f = za.access(a), g = za.set(b, f), j = f.events)) {
                    delete g.handle, g.events = {};
                    for (e in j)
                        for (c = 0, d = j[e].length; d > c; c++) fa.event.add(b, e, j[e][c])
                }
                Aa.hasData(a) && (h = Aa.access(a), i = fa.extend({}, h), Aa.set(b, i))
            }
        }

        function v(a, b) {
            var c = b.nodeName.toLowerCase();
            "input" === c && Ha.test(a.type) ? b.checked = a.checked : ("input" === c || "textarea" === c) && (b.defaultValue = a.defaultValue)
        }

        function w(a, b, c, d) {
            b = Z.apply([], b);
            var e, f, g, h, i, j, l = 0,
                n = a.length,
                o = n - 1,
                p = b[0],
                q = fa.isFunction(p);
            if (q || n > 1 && "string" == typeof p && !da.checkClone && Ra.test(p)) return a.each(function(e) {
                var f = a.eq(e);
                q && (b[0] = p.call(this, e, f.html())), w(f, b, c, d)
            });
            if (n && (e = m(b, a[0].ownerDocument, !1, a, d), f = e.firstChild, 1 === e.childNodes.length && (e = f), f || d)) {
                for (g = fa.map(k(e, "script"), s), h = g.length; n > l; l++) i = e, l !== o && (i = fa.clone(i, !0, !0), h && fa.merge(g, k(i, "script"))), c.call(a[l], i, l);
                if (h)
                    for (j = g[g.length - 1].ownerDocument, fa.map(g, t), l = 0; h > l; l++) i = g[l], Ja.test(i.type || "") && !za.access(i, "globalEval") && fa.contains(j, i) && (i.src ? fa._evalUrl && fa._evalUrl(i.src) : fa.globalEval(i.textContent.replace(Ta, "")))
            }
            return a
        }

        function x(a, b, c) {
            for (var d, e = b ? fa.filter(b, a) : a, f = 0; null != (d = e[f]); f++) c || 1 !== d.nodeType || fa.cleanData(k(d)), d.parentNode && (c && fa.contains(d.ownerDocument, d) && l(k(d, "script")), d.parentNode.removeChild(d));
            return a
        }

        function y(a, b) {
            var c = fa(b.createElement(a)).appendTo(b.body),
                d = fa.css(c[0], "display");
            return c.detach(), d
        }

        function z(a) {
            var b = X,
                c = Va[a];
            return c || (c = y(a, b), "none" !== c && c || (Ua = (Ua || fa("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement), b = Ua[0].contentDocument, b.write(), b.close(), c = y(a, b), Ua.detach()), Va[a] = c), c
        }

        function A(a, b, c) {
            var d, e, f, g, h = a.style;
            return c = c || Ya(a), c && (g = c.getPropertyValue(b) || c[b], "" !== g || fa.contains(a.ownerDocument, a) || (g = fa.style(a, b)), !da.pixelMarginRight() && Xa.test(g) && Wa.test(b) && (d = h.width, e = h.minWidth, f = h.maxWidth, h.minWidth = h.maxWidth = h.width = g, g = c.width, h.width = d, h.minWidth = e, h.maxWidth = f)), void 0 !== g ? g + "" : g
        }

        function B(a, b) {
            return {
                get: function() {
                    return a() ? void delete this.get : (this.get = b).apply(this, arguments)
                }
            }
        }

        function C(a) {
            if (a in db) return a;
            for (var b = a[0].toUpperCase() + a.slice(1), c = cb.length; c--;)
                if (a = cb[c] + b, a in db) return a
        }

        function D(a, b, c) {
            var d = Ea.exec(b);
            return d ? Math.max(0, d[2] - (c || 0)) + (d[3] || "px") : b
        }

        function E(a, b, c, d, e) {
            for (var f = c === (d ? "border" : "content") ? 4 : "width" === b ? 1 : 0, g = 0; 4 > f; f += 2) "margin" === c && (g += fa.css(a, c + Fa[f], !0, e)), d ? ("content" === c && (g -= fa.css(a, "padding" + Fa[f], !0, e)), "margin" !== c && (g -= fa.css(a, "border" + Fa[f] + "Width", !0, e))) : (g += fa.css(a, "padding" + Fa[f], !0, e), "padding" !== c && (g += fa.css(a, "border" + Fa[f] + "Width", !0, e)));
            return g
        }

        function F(b, c, d) {
            var e = !0,
                f = "width" === c ? b.offsetWidth : b.offsetHeight,
                g = Ya(b),
                h = "border-box" === fa.css(b, "boxSizing", !1, g);
            if (X.msFullscreenElement && a.top !== a && b.getClientRects().length && (f = Math.round(100 * b.getBoundingClientRect()[c])), 0 >= f || null == f) {
                if (f = A(b, c, g), (0 > f || null == f) && (f = b.style[c]), Xa.test(f)) return f;
                e = h && (da.boxSizingReliable() || f === b.style[c]), f = parseFloat(f) || 0
            }
            return f + E(b, c, d || (h ? "border" : "content"), e, g) + "px"
        }

        function G(a, b) {
            for (var c, d, e, f = [], g = 0, h = a.length; h > g; g++) d = a[g], d.style && (f[g] = za.get(d, "olddisplay"), c = d.style.display, b ? (f[g] || "none" !== c || (d.style.display = ""), "" === d.style.display && Ga(d) && (f[g] = za.access(d, "olddisplay", z(d.nodeName)))) : (e = Ga(d), "none" === c && e || za.set(d, "olddisplay", e ? c : fa.css(d, "display"))));
            for (g = 0; h > g; g++) d = a[g], d.style && (b && "none" !== d.style.display && "" !== d.style.display || (d.style.display = b ? f[g] || "" : "none"));
            return a
        }

        function H(a, b, c, d, e) {
            return new H.prototype.init(a, b, c, d, e)
        }

        function I() {
            return a.setTimeout(function() {
                eb = void 0
            }), eb = fa.now()
        }

        function J(a, b) {
            var c, d = 0,
                e = {
                    height: a
                };
            for (b = b ? 1 : 0; 4 > d; d += 2 - b) c = Fa[d], e["margin" + c] = e["padding" + c] = a;
            return b && (e.opacity = e.width = a), e
        }

        function K(a, b, c) {
            for (var d, e = (N.tweeners[b] || []).concat(N.tweeners["*"]), f = 0, g = e.length; g > f; f++)
                if (d = e[f].call(c, b, a)) return d
        }

        function L(a, b, c) {
            var d, e, f, g, h, i, j, k, l = this,
                m = {},
                n = a.style,
                o = a.nodeType && Ga(a),
                p = za.get(a, "fxshow");
            c.queue || (h = fa._queueHooks(a, "fx"), null == h.unqueued && (h.unqueued = 0, i = h.empty.fire, h.empty.fire = function() {
                h.unqueued || i()
            }), h.unqueued++, l.always(function() {
                l.always(function() {
                    h.unqueued--, fa.queue(a, "fx").length || h.empty.fire()
                })
            })), 1 === a.nodeType && ("height" in b || "width" in b) && (c.overflow = [n.overflow, n.overflowX, n.overflowY], j = fa.css(a, "display"), k = "none" === j ? za.get(a, "olddisplay") || z(a.nodeName) : j, "inline" === k && "none" === fa.css(a, "float") && (n.display = "inline-block")), c.overflow && (n.overflow = "hidden", l.always(function() {
                n.overflow = c.overflow[0], n.overflowX = c.overflow[1], n.overflowY = c.overflow[2]
            }));
            for (d in b)
                if (e = b[d], gb.exec(e)) {
                    if (delete b[d], f = f || "toggle" === e, e === (o ? "hide" : "show")) {
                        if ("show" !== e || !p || void 0 === p[d]) continue;
                        o = !0
                    }
                    m[d] = p && p[d] || fa.style(a, d)
                } else j = void 0;
            if (fa.isEmptyObject(m)) "inline" === ("none" === j ? z(a.nodeName) : j) && (n.display = j);
            else {
                p ? "hidden" in p && (o = p.hidden) : p = za.access(a, "fxshow", {}), f && (p.hidden = !o), o ? fa(a).show() : l.done(function() {
                    fa(a).hide()
                }), l.done(function() {
                    var b;
                    za.remove(a, "fxshow");
                    for (b in m) fa.style(a, b, m[b])
                });
                for (d in m) g = K(o ? p[d] : 0, d, l), d in p || (p[d] = g.start, o && (g.end = g.start, g.start = "width" === d || "height" === d ? 1 : 0))
            }
        }

        function M(a, b) {
            var c, d, e, f, g;
            for (c in a)
                if (d = fa.camelCase(c), e = b[d], f = a[c], fa.isArray(f) && (e = f[1], f = a[c] = f[0]), c !== d && (a[d] = f, delete a[c]), g = fa.cssHooks[d], g && "expand" in g) {
                    f = g.expand(f), delete a[d];
                    for (c in f) c in a || (a[c] = f[c], b[c] = e)
                } else b[d] = e
        }

        function N(a, b, c) {
            var d, e, f = 0,
                g = N.prefilters.length,
                h = fa.Deferred().always(function() {
                    delete i.elem
                }),
                i = function() {
                    if (e) return !1;
                    for (var b = eb || I(), c = Math.max(0, j.startTime + j.duration - b), d = c / j.duration || 0, f = 1 - d, g = 0, i = j.tweens.length; i > g; g++) j.tweens[g].run(f);
                    return h.notifyWith(a, [j, f, c]), 1 > f && i ? c : (h.resolveWith(a, [j]), !1)
                },
                j = h.promise({
                    elem: a,
                    props: fa.extend({}, b),
                    opts: fa.extend(!0, {
                        specialEasing: {},
                        easing: fa.easing._default
                    }, c),
                    originalProperties: b,
                    originalOptions: c,
                    startTime: eb || I(),
                    duration: c.duration,
                    tweens: [],
                    createTween: function(b, c) {
                        var d = fa.Tween(a, j.opts, b, c, j.opts.specialEasing[b] || j.opts.easing);
                        return j.tweens.push(d), d
                    },
                    stop: function(b) {
                        var c = 0,
                            d = b ? j.tweens.length : 0;
                        if (e) return this;
                        for (e = !0; d > c; c++) j.tweens[c].run(1);
                        return b ? (h.notifyWith(a, [j, 1, 0]), h.resolveWith(a, [j, b])) : h.rejectWith(a, [j, b]), this
                    }
                }),
                k = j.props;
            for (M(k, j.opts.specialEasing); g > f; f++)
                if (d = N.prefilters[f].call(j, a, k, j.opts)) return fa.isFunction(d.stop) && (fa._queueHooks(j.elem, j.opts.queue).stop = fa.proxy(d.stop, d)), d;
            return fa.map(k, K, j), fa.isFunction(j.opts.start) && j.opts.start.call(a, j), fa.fx.timer(fa.extend(i, {
                elem: a,
                anim: j,
                queue: j.opts.queue
            })), j.progress(j.opts.progress).done(j.opts.done, j.opts.complete).fail(j.opts.fail).always(j.opts.always)
        }

        function O(a) {
            return a.getAttribute && a.getAttribute("class") || ""
        }

        function P(a) {
            return function(b, c) {
                "string" != typeof b && (c = b, b = "*");
                var d, e = 0,
                    f = b.toLowerCase().match(va) || [];
                if (fa.isFunction(c))
                    for (; d = f[e++];) "+" === d[0] ? (d = d.slice(1) || "*", (a[d] = a[d] || []).unshift(c)) : (a[d] = a[d] || []).push(c)
            }
        }

        function Q(a, b, c, d) {
            function e(h) {
                var i;
                return f[h] = !0, fa.each(a[h] || [], function(a, h) {
                    var j = h(b, c, d);
                    return "string" != typeof j || g || f[j] ? g ? !(i = j) : void 0 : (b.dataTypes.unshift(j), e(j), !1)
                }), i
            }
            var f = {},
                g = a === zb;
            return e(b.dataTypes[0]) || !f["*"] && e("*")
        }

        function R(a, b) {
            var c, d, e = fa.ajaxSettings.flatOptions || {};
            for (c in b) void 0 !== b[c] && ((e[c] ? a : d || (d = {}))[c] = b[c]);
            return d && fa.extend(!0, a, d), a
        }

        function S(a, b, c) {
            for (var d, e, f, g, h = a.contents, i = a.dataTypes;
                "*" === i[0];) i.shift(), void 0 === d && (d = a.mimeType || b.getResponseHeader("Content-Type"));
            if (d)
                for (e in h)
                    if (h[e] && h[e].test(d)) {
                        i.unshift(e);
                        break
                    }
            if (i[0] in c) f = i[0];
            else {
                for (e in c) {
                    if (!i[0] || a.converters[e + " " + i[0]]) {
                        f = e;
                        break
                    }
                    g || (g = e)
                }
                f = f || g
            }
            return f ? (f !== i[0] && i.unshift(f), c[f]) : void 0
        }

        function T(a, b, c, d) {
            var e, f, g, h, i, j = {},
                k = a.dataTypes.slice();
            if (k[1])
                for (g in a.converters) j[g.toLowerCase()] = a.converters[g];
            for (f = k.shift(); f;)
                if (a.responseFields[f] && (c[a.responseFields[f]] = b), !i && d && a.dataFilter && (b = a.dataFilter(b, a.dataType)), i = f, f = k.shift())
                    if ("*" === f) f = i;
                    else if ("*" !== i && i !== f) {
                if (g = j[i + " " + f] || j["* " + f], !g)
                    for (e in j)
                        if (h = e.split(" "), h[1] === f && (g = j[i + " " + h[0]] || j["* " + h[0]])) {
                            g === !0 ? g = j[e] : j[e] !== !0 && (f = h[0], k.unshift(h[1]));
                            break
                        }
                if (g !== !0)
                    if (g && a["throws"]) b = g(b);
                    else try {
                        b = g(b)
                    } catch (l) {
                        return {
                            state: "parsererror",
                            error: g ? l : "No conversion from " + i + " to " + f
                        }
                    }
            }
            return {
                state: "success",
                data: b
            }
        }

        function U(a, b, c, d) {
            var e;
            if (fa.isArray(b)) fa.each(b, function(b, e) {
                c || Db.test(a) ? d(a, e) : U(a + "[" + ("object" == typeof e && null != e ? b : "") + "]", e, c, d)
            });
            else if (c || "object" !== fa.type(b)) d(a, b);
            else
                for (e in b) U(a + "[" + e + "]", b[e], c, d)
        }

        function V(a) {
            return fa.isWindow(a) ? a : 9 === a.nodeType && a.defaultView
        }
        var W = [],
            X = a.document,
            Y = W.slice,
            Z = W.concat,
            $ = W.push,
            _ = W.indexOf,
            aa = {},
            ba = aa.toString,
            ca = aa.hasOwnProperty,
            da = {},
            ea = "2.2.0",
            fa = function(a, b) {
                return new fa.fn.init(a, b)
            },
            ga = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
            ha = /^-ms-/,
            ia = /-([\da-z])/gi,
            ja = function(a, b) {
                return b.toUpperCase()
            };
        fa.fn = fa.prototype = {
            jquery: ea,
            constructor: fa,
            selector: "",
            length: 0,
            toArray: function() {
                return Y.call(this)
            },
            get: function(a) {
                return null != a ? 0 > a ? this[a + this.length] : this[a] : Y.call(this)
            },
            pushStack: function(a) {
                var b = fa.merge(this.constructor(), a);
                return b.prevObject = this, b.context = this.context, b
            },
            each: function(a) {
                return fa.each(this, a)
            },
            map: function(a) {
                return this.pushStack(fa.map(this, function(b, c) {
                    return a.call(b, c, b)
                }))
            },
            slice: function() {
                return this.pushStack(Y.apply(this, arguments))
            },
            first: function() {
                return this.eq(0)
            },
            last: function() {
                return this.eq(-1)
            },
            eq: function(a) {
                var b = this.length,
                    c = +a + (0 > a ? b : 0);
                return this.pushStack(c >= 0 && b > c ? [this[c]] : [])
            },
            end: function() {
                return this.prevObject || this.constructor()
            },
            push: $,
            sort: W.sort,
            splice: W.splice
        }, fa.extend = fa.fn.extend = function() {
            var a, b, c, d, e, f, g = arguments[0] || {},
                h = 1,
                i = arguments.length,
                j = !1;
            for ("boolean" == typeof g && (j = g, g = arguments[h] || {}, h++), "object" == typeof g || fa.isFunction(g) || (g = {}), h === i && (g = this, h--); i > h; h++)
                if (null != (a = arguments[h]))
                    for (b in a) c = g[b], d = a[b], g !== d && (j && d && (fa.isPlainObject(d) || (e = fa.isArray(d))) ? (e ? (e = !1, f = c && fa.isArray(c) ? c : []) : f = c && fa.isPlainObject(c) ? c : {}, g[b] = fa.extend(j, f, d)) : void 0 !== d && (g[b] = d));
            return g
        }, fa.extend({
            expando: "jQuery" + (ea + Math.random()).replace(/\D/g, ""),
            isReady: !0,
            error: function(a) {
                throw new Error(a)
            },
            noop: function() {},
            isFunction: function(a) {
                return "function" === fa.type(a)
            },
            isArray: Array.isArray,
            isWindow: function(a) {
                return null != a && a === a.window
            },
            isNumeric: function(a) {
                var b = a && a.toString();
                return !fa.isArray(a) && b - parseFloat(b) + 1 >= 0
            },
            isPlainObject: function(a) {
                return "object" !== fa.type(a) || a.nodeType || fa.isWindow(a) ? !1 : a.constructor && !ca.call(a.constructor.prototype, "isPrototypeOf") ? !1 : !0
            },
            isEmptyObject: function(a) {
                var b;
                for (b in a) return !1;
                return !0
            },
            type: function(a) {
                return null == a ? a + "" : "object" == typeof a || "function" == typeof a ? aa[ba.call(a)] || "object" : typeof a
            },
            globalEval: function(a) {
                var b, c = eval;
                a = fa.trim(a), a && (1 === a.indexOf("use strict") ? (b = X.createElement("script"), b.text = a, X.head.appendChild(b).parentNode.removeChild(b)) : c(a))
            },
            camelCase: function(a) {
                return a.replace(ha, "ms-").replace(ia, ja)
            },
            nodeName: function(a, b) {
                return a.nodeName && a.nodeName.toLowerCase() === b.toLowerCase()
            },
            each: function(a, b) {
                var d, e = 0;
                if (c(a))
                    for (d = a.length; d > e && b.call(a[e], e, a[e]) !== !1; e++);
                else
                    for (e in a)
                        if (b.call(a[e], e, a[e]) === !1) break; return a
            },
            trim: function(a) {
                return null == a ? "" : (a + "").replace(ga, "")
            },
            makeArray: function(a, b) {
                var d = b || [];
                return null != a && (c(Object(a)) ? fa.merge(d, "string" == typeof a ? [a] : a) : $.call(d, a)), d
            },
            inArray: function(a, b, c) {
                return null == b ? -1 : _.call(b, a, c)
            },
            merge: function(a, b) {
                for (var c = +b.length, d = 0, e = a.length; c > d; d++) a[e++] = b[d];
                return a.length = e, a
            },
            grep: function(a, b, c) {
                for (var d, e = [], f = 0, g = a.length, h = !c; g > f; f++) d = !b(a[f], f), d !== h && e.push(a[f]);
                return e
            },
            map: function(a, b, d) {
                var e, f, g = 0,
                    h = [];
                if (c(a))
                    for (e = a.length; e > g; g++) f = b(a[g], g, d), null != f && h.push(f);
                else
                    for (g in a) f = b(a[g], g, d), null != f && h.push(f);
                return Z.apply([], h)
            },
            guid: 1,
            proxy: function(a, b) {
                var c, d, e;
                return "string" == typeof b && (c = a[b], b = a, a = c), fa.isFunction(a) ? (d = Y.call(arguments, 2), e = function() {
                    return a.apply(b || this, d.concat(Y.call(arguments)))
                }, e.guid = a.guid = a.guid || fa.guid++, e) : void 0
            },
            now: Date.now,
            support: da
        }), "function" == typeof Symbol && (fa.fn[Symbol.iterator] = W[Symbol.iterator]), fa.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "), function(a, b) {
            aa["[object " + b + "]"] = b.toLowerCase()
        });
        var ka = function(a) {
            function b(a, b, c, d) {
                var e, f, g, h, i, j, l, n, o = b && b.ownerDocument,
                    p = b ? b.nodeType : 9;
                if (c = c || [], "string" != typeof a || !a || 1 !== p && 9 !== p && 11 !== p) return c;
                if (!d && ((b ? b.ownerDocument || b : O) !== G && F(b), b = b || G, I)) {
                    if (11 !== p && (j = ra.exec(a)))
                        if (e = j[1]) {
                            if (9 === p) {
                                if (!(g = b.getElementById(e))) return c;
                                if (g.id === e) return c.push(g), c
                            } else if (o && (g = o.getElementById(e)) && M(b, g) && g.id === e) return c.push(g), c
                        } else {
                            if (j[2]) return $.apply(c, b.getElementsByTagName(a)), c;
                            if ((e = j[3]) && v.getElementsByClassName && b.getElementsByClassName) return $.apply(c, b.getElementsByClassName(e)), c
                        }
                    if (v.qsa && !T[a + " "] && (!J || !J.test(a))) {
                        if (1 !== p) o = b, n = a;
                        else if ("object" !== b.nodeName.toLowerCase()) {
                            for ((h = b.getAttribute("id")) ? h = h.replace(ta, "\\$&") : b.setAttribute("id", h = N), l = z(a), f = l.length, i = ma.test(h) ? "#" + h : "[id='" + h + "']"; f--;) l[f] = i + " " + m(l[f]);
                            n = l.join(","), o = sa.test(a) && k(b.parentNode) || b
                        }
                        if (n) try {
                            return $.apply(c, o.querySelectorAll(n)), c
                        } catch (q) {} finally {
                            h === N && b.removeAttribute("id")
                        }
                    }
                }
                return B(a.replace(ha, "$1"), b, c, d)
            }

            function c() {
                function a(c, d) {
                    return b.push(c + " ") > w.cacheLength && delete a[b.shift()], a[c + " "] = d
                }
                var b = [];
                return a
            }

            function d(a) {
                return a[N] = !0, a
            }

            function e(a) {
                var b = G.createElement("div");
                try {
                    return !!a(b)
                } catch (c) {
                    return !1
                } finally {
                    b.parentNode && b.parentNode.removeChild(b), b = null
                }
            }

            function f(a, b) {
                for (var c = a.split("|"), d = c.length; d--;) w.attrHandle[c[d]] = b
            }

            function g(a, b) {
                var c = b && a,
                    d = c && 1 === a.nodeType && 1 === b.nodeType && (~b.sourceIndex || V) - (~a.sourceIndex || V);
                if (d) return d;
                if (c)
                    for (; c = c.nextSibling;)
                        if (c === b) return -1;
                return a ? 1 : -1
            }

            function h(a) {
                return function(b) {
                    var c = b.nodeName.toLowerCase();
                    return "input" === c && b.type === a
                }
            }

            function i(a) {
                return function(b) {
                    var c = b.nodeName.toLowerCase();
                    return ("input" === c || "button" === c) && b.type === a
                }
            }

            function j(a) {
                return d(function(b) {
                    return b = +b, d(function(c, d) {
                        for (var e, f = a([], c.length, b), g = f.length; g--;) c[e = f[g]] && (c[e] = !(d[e] = c[e]))
                    })
                })
            }

            function k(a) {
                return a && "undefined" != typeof a.getElementsByTagName && a
            }

            function l() {}

            function m(a) {
                for (var b = 0, c = a.length, d = ""; c > b; b++) d += a[b].value;
                return d
            }

            function n(a, b, c) {
                var d = b.dir,
                    e = c && "parentNode" === d,
                    f = Q++;
                return b.first ? function(b, c, f) {
                    for (; b = b[d];)
                        if (1 === b.nodeType || e) return a(b, c, f)
                } : function(b, c, g) {
                    var h, i, j, k = [P, f];
                    if (g) {
                        for (; b = b[d];)
                            if ((1 === b.nodeType || e) && a(b, c, g)) return !0
                    } else
                        for (; b = b[d];)
                            if (1 === b.nodeType || e) {
                                if (j = b[N] || (b[N] = {}), i = j[b.uniqueID] || (j[b.uniqueID] = {}), (h = i[d]) && h[0] === P && h[1] === f) return k[2] = h[2];
                                if (i[d] = k, k[2] = a(b, c, g)) return !0
                            }
                }
            }

            function o(a) {
                return a.length > 1 ? function(b, c, d) {
                    for (var e = a.length; e--;)
                        if (!a[e](b, c, d)) return !1;
                    return !0
                } : a[0]
            }

            function p(a, c, d) {
                for (var e = 0, f = c.length; f > e; e++) b(a, c[e], d);
                return d
            }

            function q(a, b, c, d, e) {
                for (var f, g = [], h = 0, i = a.length, j = null != b; i > h; h++)(f = a[h]) && (!c || c(f, d, e)) && (g.push(f), j && b.push(h));
                return g
            }

            function r(a, b, c, e, f, g) {
                return e && !e[N] && (e = r(e)), f && !f[N] && (f = r(f, g)), d(function(d, g, h, i) {
                    var j, k, l, m = [],
                        n = [],
                        o = g.length,
                        r = d || p(b || "*", h.nodeType ? [h] : h, []),
                        s = !a || !d && b ? r : q(r, m, a, h, i),
                        t = c ? f || (d ? a : o || e) ? [] : g : s;
                    if (c && c(s, t, h, i), e)
                        for (j = q(t, n), e(j, [], h, i), k = j.length; k--;)(l = j[k]) && (t[n[k]] = !(s[n[k]] = l));
                    if (d) {
                        if (f || a) {
                            if (f) {
                                for (j = [], k = t.length; k--;)(l = t[k]) && j.push(s[k] = l);
                                f(null, t = [], j, i)
                            }
                            for (k = t.length; k--;)(l = t[k]) && (j = f ? aa(d, l) : m[k]) > -1 && (d[j] = !(g[j] = l))
                        }
                    } else t = q(t === g ? t.splice(o, t.length) : t), f ? f(null, g, t, i) : $.apply(g, t)
                })
            }

            function s(a) {
                for (var b, c, d, e = a.length, f = w.relative[a[0].type], g = f || w.relative[" "], h = f ? 1 : 0, i = n(function(a) {
                        return a === b
                    }, g, !0), j = n(function(a) {
                        return aa(b, a) > -1
                    }, g, !0), k = [function(a, c, d) {
                        var e = !f && (d || c !== C) || ((b = c).nodeType ? i(a, c, d) : j(a, c, d));
                        return b = null, e
                    }]; e > h; h++)
                    if (c = w.relative[a[h].type]) k = [n(o(k), c)];
                    else {
                        if (c = w.filter[a[h].type].apply(null, a[h].matches), c[N]) {
                            for (d = ++h; e > d && !w.relative[a[d].type]; d++);
                            return r(h > 1 && o(k), h > 1 && m(a.slice(0, h - 1).concat({
                                value: " " === a[h - 2].type ? "*" : ""
                            })).replace(ha, "$1"), c, d > h && s(a.slice(h, d)), e > d && s(a = a.slice(d)), e > d && m(a))
                        }
                        k.push(c)
                    }
                return o(k)
            }

            function t(a, c) {
                var e = c.length > 0,
                    f = a.length > 0,
                    g = function(d, g, h, i, j) {
                        var k, l, m, n = 0,
                            o = "0",
                            p = d && [],
                            r = [],
                            s = C,
                            t = d || f && w.find.TAG("*", j),
                            u = P += null == s ? 1 : Math.random() || .1,
                            v = t.length;
                        for (j && (C = g === G || g || j); o !== v && null != (k = t[o]); o++) {
                            if (f && k) {
                                for (l = 0, g || k.ownerDocument === G || (F(k), h = !I); m = a[l++];)
                                    if (m(k, g || G, h)) {
                                        i.push(k);
                                        break
                                    }
                                j && (P = u)
                            }
                            e && ((k = !m && k) && n--, d && p.push(k))
                        }
                        if (n += o, e && o !== n) {
                            for (l = 0; m = c[l++];) m(p, r, g, h);
                            if (d) {
                                if (n > 0)
                                    for (; o--;) p[o] || r[o] || (r[o] = Y.call(i));
                                r = q(r)
                            }
                            $.apply(i, r), j && !d && r.length > 0 && n + c.length > 1 && b.uniqueSort(i)
                        }
                        return j && (P = u, C = s), p
                    };
                return e ? d(g) : g
            }
            var u, v, w, x, y, z, A, B, C, D, E, F, G, H, I, J, K, L, M, N = "sizzle" + 1 * new Date,
                O = a.document,
                P = 0,
                Q = 0,
                R = c(),
                S = c(),
                T = c(),
                U = function(a, b) {
                    return a === b && (E = !0), 0
                },
                V = 1 << 31,
                W = {}.hasOwnProperty,
                X = [],
                Y = X.pop,
                Z = X.push,
                $ = X.push,
                _ = X.slice,
                aa = function(a, b) {
                    for (var c = 0, d = a.length; d > c; c++)
                        if (a[c] === b) return c;
                    return -1
                },
                ba = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",
                ca = "[\\x20\\t\\r\\n\\f]",
                da = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",
                ea = "\\[" + ca + "*(" + da + ")(?:" + ca + "*([*^$|!~]?=)" + ca + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + da + "))|)" + ca + "*\\]",
                fa = ":(" + da + ")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|" + ea + ")*)|.*)\\)|)",
                ga = new RegExp(ca + "+", "g"),
                ha = new RegExp("^" + ca + "+|((?:^|[^\\\\])(?:\\\\.)*)" + ca + "+$", "g"),
                ia = new RegExp("^" + ca + "*," + ca + "*"),
                ja = new RegExp("^" + ca + "*([>+~]|" + ca + ")" + ca + "*"),
                ka = new RegExp("=" + ca + "*([^\\]'\"]*?)" + ca + "*\\]", "g"),
                la = new RegExp(fa),
                ma = new RegExp("^" + da + "$"),
                na = {
                    ID: new RegExp("^#(" + da + ")"),
                    CLASS: new RegExp("^\\.(" + da + ")"),
                    TAG: new RegExp("^(" + da + "|[*])"),
                    ATTR: new RegExp("^" + ea),
                    PSEUDO: new RegExp("^" + fa),
                    CHILD: new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + ca + "*(even|odd|(([+-]|)(\\d*)n|)" + ca + "*(?:([+-]|)" + ca + "*(\\d+)|))" + ca + "*\\)|)", "i"),
                    bool: new RegExp("^(?:" + ba + ")$", "i"),
                    needsContext: new RegExp("^" + ca + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + ca + "*((?:-\\d)?\\d*)" + ca + "*\\)|)(?=[^-]|$)", "i")
                },
                oa = /^(?:input|select|textarea|button)$/i,
                pa = /^h\d$/i,
                qa = /^[^{]+\{\s*\[native \w/,
                ra = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
                sa = /[+~]/,
                ta = /'|\\/g,
                ua = new RegExp("\\\\([\\da-f]{1,6}" + ca + "?|(" + ca + ")|.)", "ig"),
                va = function(a, b, c) {
                    var d = "0x" + b - 65536;
                    return d !== d || c ? b : 0 > d ? String.fromCharCode(d + 65536) : String.fromCharCode(d >> 10 | 55296, 1023 & d | 56320)
                },
                wa = function() {
                    F()
                };
            try {
                $.apply(X = _.call(O.childNodes), O.childNodes), X[O.childNodes.length].nodeType
            } catch (xa) {
                $ = {
                    apply: X.length ? function(a, b) {
                        Z.apply(a, _.call(b))
                    } : function(a, b) {
                        for (var c = a.length, d = 0; a[c++] = b[d++];);
                        a.length = c - 1
                    }
                }
            }
            v = b.support = {}, y = b.isXML = function(a) {
                var b = a && (a.ownerDocument || a).documentElement;
                return b ? "HTML" !== b.nodeName : !1
            }, F = b.setDocument = function(a) {
                var b, c, d = a ? a.ownerDocument || a : O;
                return d !== G && 9 === d.nodeType && d.documentElement ? (G = d, H = G.documentElement, I = !y(G), (c = G.defaultView) && c.top !== c && (c.addEventListener ? c.addEventListener("unload", wa, !1) : c.attachEvent && c.attachEvent("onunload", wa)), v.attributes = e(function(a) {
                        return a.className = "i", !a.getAttribute("className")
                    }), v.getElementsByTagName = e(function(a) {
                        return a.appendChild(G.createComment("")), !a.getElementsByTagName("*").length
                    }),
                    v.getElementsByClassName = qa.test(G.getElementsByClassName), v.getById = e(function(a) {
                        return H.appendChild(a).id = N, !G.getElementsByName || !G.getElementsByName(N).length
                    }), v.getById ? (w.find.ID = function(a, b) {
                        if ("undefined" != typeof b.getElementById && I) {
                            var c = b.getElementById(a);
                            return c ? [c] : []
                        }
                    }, w.filter.ID = function(a) {
                        var b = a.replace(ua, va);
                        return function(a) {
                            return a.getAttribute("id") === b
                        }
                    }) : (delete w.find.ID, w.filter.ID = function(a) {
                        var b = a.replace(ua, va);
                        return function(a) {
                            var c = "undefined" != typeof a.getAttributeNode && a.getAttributeNode("id");
                            return c && c.value === b
                        }
                    }), w.find.TAG = v.getElementsByTagName ? function(a, b) {
                        return "undefined" != typeof b.getElementsByTagName ? b.getElementsByTagName(a) : v.qsa ? b.querySelectorAll(a) : void 0
                    } : function(a, b) {
                        var c, d = [],
                            e = 0,
                            f = b.getElementsByTagName(a);
                        if ("*" === a) {
                            for (; c = f[e++];) 1 === c.nodeType && d.push(c);
                            return d
                        }
                        return f
                    }, w.find.CLASS = v.getElementsByClassName && function(a, b) {
                        return "undefined" != typeof b.getElementsByClassName && I ? b.getElementsByClassName(a) : void 0
                    }, K = [], J = [], (v.qsa = qa.test(G.querySelectorAll)) && (e(function(a) {
                        H.appendChild(a).innerHTML = "<a id='" + N + "'></a><select id='" + N + "-\r\\' msallowcapture=''><option selected=''></option></select>", a.querySelectorAll("[msallowcapture^='']").length && J.push("[*^$]=" + ca + "*(?:''|\"\")"), a.querySelectorAll("[selected]").length || J.push("\\[" + ca + "*(?:value|" + ba + ")"), a.querySelectorAll("[id~=" + N + "-]").length || J.push("~="), a.querySelectorAll(":checked").length || J.push(":checked"), a.querySelectorAll("a#" + N + "+*").length || J.push(".#.+[+~]")
                    }), e(function(a) {
                        var b = G.createElement("input");
                        b.setAttribute("type", "hidden"), a.appendChild(b).setAttribute("name", "D"), a.querySelectorAll("[name=d]").length && J.push("name" + ca + "*[*^$|!~]?="), a.querySelectorAll(":enabled").length || J.push(":enabled", ":disabled"), a.querySelectorAll("*,:x"), J.push(",.*:")
                    })), (v.matchesSelector = qa.test(L = H.matches || H.webkitMatchesSelector || H.mozMatchesSelector || H.oMatchesSelector || H.msMatchesSelector)) && e(function(a) {
                        v.disconnectedMatch = L.call(a, "div"), L.call(a, "[s!='']:x"), K.push("!=", fa)
                    }), J = J.length && new RegExp(J.join("|")), K = K.length && new RegExp(K.join("|")), b = qa.test(H.compareDocumentPosition), M = b || qa.test(H.contains) ? function(a, b) {
                        var c = 9 === a.nodeType ? a.documentElement : a,
                            d = b && b.parentNode;
                        return a === d || !(!d || 1 !== d.nodeType || !(c.contains ? c.contains(d) : a.compareDocumentPosition && 16 & a.compareDocumentPosition(d)))
                    } : function(a, b) {
                        if (b)
                            for (; b = b.parentNode;)
                                if (b === a) return !0;
                        return !1
                    }, U = b ? function(a, b) {
                        if (a === b) return E = !0, 0;
                        var c = !a.compareDocumentPosition - !b.compareDocumentPosition;
                        return c ? c : (c = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) : 1, 1 & c || !v.sortDetached && b.compareDocumentPosition(a) === c ? a === G || a.ownerDocument === O && M(O, a) ? -1 : b === G || b.ownerDocument === O && M(O, b) ? 1 : D ? aa(D, a) - aa(D, b) : 0 : 4 & c ? -1 : 1)
                    } : function(a, b) {
                        if (a === b) return E = !0, 0;
                        var c, d = 0,
                            e = a.parentNode,
                            f = b.parentNode,
                            h = [a],
                            i = [b];
                        if (!e || !f) return a === G ? -1 : b === G ? 1 : e ? -1 : f ? 1 : D ? aa(D, a) - aa(D, b) : 0;
                        if (e === f) return g(a, b);
                        for (c = a; c = c.parentNode;) h.unshift(c);
                        for (c = b; c = c.parentNode;) i.unshift(c);
                        for (; h[d] === i[d];) d++;
                        return d ? g(h[d], i[d]) : h[d] === O ? -1 : i[d] === O ? 1 : 0
                    }, G) : G
            }, b.matches = function(a, c) {
                return b(a, null, null, c)
            }, b.matchesSelector = function(a, c) {
                if ((a.ownerDocument || a) !== G && F(a), c = c.replace(ka, "='$1']"), v.matchesSelector && I && !T[c + " "] && (!K || !K.test(c)) && (!J || !J.test(c))) try {
                    var d = L.call(a, c);
                    if (d || v.disconnectedMatch || a.document && 11 !== a.document.nodeType) return d
                } catch (e) {}
                return b(c, G, null, [a]).length > 0
            }, b.contains = function(a, b) {
                return (a.ownerDocument || a) !== G && F(a), M(a, b)
            }, b.attr = function(a, b) {
                (a.ownerDocument || a) !== G && F(a);
                var c = w.attrHandle[b.toLowerCase()],
                    d = c && W.call(w.attrHandle, b.toLowerCase()) ? c(a, b, !I) : void 0;
                return void 0 !== d ? d : v.attributes || !I ? a.getAttribute(b) : (d = a.getAttributeNode(b)) && d.specified ? d.value : null
            }, b.error = function(a) {
                throw new Error("Syntax error, unrecognized expression: " + a)
            }, b.uniqueSort = function(a) {
                var b, c = [],
                    d = 0,
                    e = 0;
                if (E = !v.detectDuplicates, D = !v.sortStable && a.slice(0), a.sort(U), E) {
                    for (; b = a[e++];) b === a[e] && (d = c.push(e));
                    for (; d--;) a.splice(c[d], 1)
                }
                return D = null, a
            }, x = b.getText = function(a) {
                var b, c = "",
                    d = 0,
                    e = a.nodeType;
                if (e) {
                    if (1 === e || 9 === e || 11 === e) {
                        if ("string" == typeof a.textContent) return a.textContent;
                        for (a = a.firstChild; a; a = a.nextSibling) c += x(a)
                    } else if (3 === e || 4 === e) return a.nodeValue
                } else
                    for (; b = a[d++];) c += x(b);
                return c
            }, w = b.selectors = {
                cacheLength: 50,
                createPseudo: d,
                match: na,
                attrHandle: {},
                find: {},
                relative: {
                    ">": {
                        dir: "parentNode",
                        first: !0
                    },
                    " ": {
                        dir: "parentNode"
                    },
                    "+": {
                        dir: "previousSibling",
                        first: !0
                    },
                    "~": {
                        dir: "previousSibling"
                    }
                },
                preFilter: {
                    ATTR: function(a) {
                        return a[1] = a[1].replace(ua, va), a[3] = (a[3] || a[4] || a[5] || "").replace(ua, va), "~=" === a[2] && (a[3] = " " + a[3] + " "), a.slice(0, 4)
                    },
                    CHILD: function(a) {
                        return a[1] = a[1].toLowerCase(), "nth" === a[1].slice(0, 3) ? (a[3] || b.error(a[0]), a[4] = +(a[4] ? a[5] + (a[6] || 1) : 2 * ("even" === a[3] || "odd" === a[3])), a[5] = +(a[7] + a[8] || "odd" === a[3])) : a[3] && b.error(a[0]), a
                    },
                    PSEUDO: function(a) {
                        var b, c = !a[6] && a[2];
                        return na.CHILD.test(a[0]) ? null : (a[3] ? a[2] = a[4] || a[5] || "" : c && la.test(c) && (b = z(c, !0)) && (b = c.indexOf(")", c.length - b) - c.length) && (a[0] = a[0].slice(0, b), a[2] = c.slice(0, b)), a.slice(0, 3))
                    }
                },
                filter: {
                    TAG: function(a) {
                        var b = a.replace(ua, va).toLowerCase();
                        return "*" === a ? function() {
                            return !0
                        } : function(a) {
                            return a.nodeName && a.nodeName.toLowerCase() === b
                        }
                    },
                    CLASS: function(a) {
                        var b = R[a + " "];
                        return b || (b = new RegExp("(^|" + ca + ")" + a + "(" + ca + "|$)")) && R(a, function(a) {
                            return b.test("string" == typeof a.className && a.className || "undefined" != typeof a.getAttribute && a.getAttribute("class") || "")
                        })
                    },
                    ATTR: function(a, c, d) {
                        return function(e) {
                            var f = b.attr(e, a);
                            return null == f ? "!=" === c : c ? (f += "", "=" === c ? f === d : "!=" === c ? f !== d : "^=" === c ? d && 0 === f.indexOf(d) : "*=" === c ? d && f.indexOf(d) > -1 : "$=" === c ? d && f.slice(-d.length) === d : "~=" === c ? (" " + f.replace(ga, " ") + " ").indexOf(d) > -1 : "|=" === c ? f === d || f.slice(0, d.length + 1) === d + "-" : !1) : !0
                        }
                    },
                    CHILD: function(a, b, c, d, e) {
                        var f = "nth" !== a.slice(0, 3),
                            g = "last" !== a.slice(-4),
                            h = "of-type" === b;
                        return 1 === d && 0 === e ? function(a) {
                            return !!a.parentNode
                        } : function(b, c, i) {
                            var j, k, l, m, n, o, p = f !== g ? "nextSibling" : "previousSibling",
                                q = b.parentNode,
                                r = h && b.nodeName.toLowerCase(),
                                s = !i && !h,
                                t = !1;
                            if (q) {
                                if (f) {
                                    for (; p;) {
                                        for (m = b; m = m[p];)
                                            if (h ? m.nodeName.toLowerCase() === r : 1 === m.nodeType) return !1;
                                        o = p = "only" === a && !o && "nextSibling"
                                    }
                                    return !0
                                }
                                if (o = [g ? q.firstChild : q.lastChild], g && s) {
                                    for (m = q, l = m[N] || (m[N] = {}), k = l[m.uniqueID] || (l[m.uniqueID] = {}), j = k[a] || [], n = j[0] === P && j[1], t = n && j[2], m = n && q.childNodes[n]; m = ++n && m && m[p] || (t = n = 0) || o.pop();)
                                        if (1 === m.nodeType && ++t && m === b) {
                                            k[a] = [P, n, t];
                                            break
                                        }
                                } else if (s && (m = b, l = m[N] || (m[N] = {}), k = l[m.uniqueID] || (l[m.uniqueID] = {}), j = k[a] || [], n = j[0] === P && j[1], t = n), t === !1)
                                    for (;
                                        (m = ++n && m && m[p] || (t = n = 0) || o.pop()) && ((h ? m.nodeName.toLowerCase() !== r : 1 !== m.nodeType) || !++t || (s && (l = m[N] || (m[N] = {}), k = l[m.uniqueID] || (l[m.uniqueID] = {}), k[a] = [P, t]), m !== b)););
                                return t -= e, t === d || t % d === 0 && t / d >= 0
                            }
                        }
                    },
                    PSEUDO: function(a, c) {
                        var e, f = w.pseudos[a] || w.setFilters[a.toLowerCase()] || b.error("unsupported pseudo: " + a);
                        return f[N] ? f(c) : f.length > 1 ? (e = [a, a, "", c], w.setFilters.hasOwnProperty(a.toLowerCase()) ? d(function(a, b) {
                            for (var d, e = f(a, c), g = e.length; g--;) d = aa(a, e[g]), a[d] = !(b[d] = e[g])
                        }) : function(a) {
                            return f(a, 0, e)
                        }) : f
                    }
                },
                pseudos: {
                    not: d(function(a) {
                        var b = [],
                            c = [],
                            e = A(a.replace(ha, "$1"));
                        return e[N] ? d(function(a, b, c, d) {
                            for (var f, g = e(a, null, d, []), h = a.length; h--;)(f = g[h]) && (a[h] = !(b[h] = f))
                        }) : function(a, d, f) {
                            return b[0] = a, e(b, null, f, c), b[0] = null, !c.pop()
                        }
                    }),
                    has: d(function(a) {
                        return function(c) {
                            return b(a, c).length > 0
                        }
                    }),
                    contains: d(function(a) {
                        return a = a.replace(ua, va),
                            function(b) {
                                return (b.textContent || b.innerText || x(b)).indexOf(a) > -1
                            }
                    }),
                    lang: d(function(a) {
                        return ma.test(a || "") || b.error("unsupported lang: " + a), a = a.replace(ua, va).toLowerCase(),
                            function(b) {
                                var c;
                                do
                                    if (c = I ? b.lang : b.getAttribute("xml:lang") || b.getAttribute("lang")) return c = c.toLowerCase(), c === a || 0 === c.indexOf(a + "-");
                                while ((b = b.parentNode) && 1 === b.nodeType);
                                return !1
                            }
                    }),
                    target: function(b) {
                        var c = a.location && a.location.hash;
                        return c && c.slice(1) === b.id
                    },
                    root: function(a) {
                        return a === H
                    },
                    focus: function(a) {
                        return a === G.activeElement && (!G.hasFocus || G.hasFocus()) && !!(a.type || a.href || ~a.tabIndex)
                    },
                    enabled: function(a) {
                        return a.disabled === !1
                    },
                    disabled: function(a) {
                        return a.disabled === !0
                    },
                    checked: function(a) {
                        var b = a.nodeName.toLowerCase();
                        return "input" === b && !!a.checked || "option" === b && !!a.selected
                    },
                    selected: function(a) {
                        return a.parentNode && a.parentNode.selectedIndex, a.selected === !0
                    },
                    empty: function(a) {
                        for (a = a.firstChild; a; a = a.nextSibling)
                            if (a.nodeType < 6) return !1;
                        return !0
                    },
                    parent: function(a) {
                        return !w.pseudos.empty(a)
                    },
                    header: function(a) {
                        return pa.test(a.nodeName)
                    },
                    input: function(a) {
                        return oa.test(a.nodeName)
                    },
                    button: function(a) {
                        var b = a.nodeName.toLowerCase();
                        return "input" === b && "button" === a.type || "button" === b
                    },
                    text: function(a) {
                        var b;
                        return "input" === a.nodeName.toLowerCase() && "text" === a.type && (null == (b = a.getAttribute("type")) || "text" === b.toLowerCase())
                    },
                    first: j(function() {
                        return [0]
                    }),
                    last: j(function(a, b) {
                        return [b - 1]
                    }),
                    eq: j(function(a, b, c) {
                        return [0 > c ? c + b : c]
                    }),
                    even: j(function(a, b) {
                        for (var c = 0; b > c; c += 2) a.push(c);
                        return a
                    }),
                    odd: j(function(a, b) {
                        for (var c = 1; b > c; c += 2) a.push(c);
                        return a
                    }),
                    lt: j(function(a, b, c) {
                        for (var d = 0 > c ? c + b : c; --d >= 0;) a.push(d);
                        return a
                    }),
                    gt: j(function(a, b, c) {
                        for (var d = 0 > c ? c + b : c; ++d < b;) a.push(d);
                        return a
                    })
                }
            }, w.pseudos.nth = w.pseudos.eq;
            for (u in {
                    radio: !0,
                    checkbox: !0,
                    file: !0,
                    password: !0,
                    image: !0
                }) w.pseudos[u] = h(u);
            for (u in {
                    submit: !0,
                    reset: !0
                }) w.pseudos[u] = i(u);
            return l.prototype = w.filters = w.pseudos, w.setFilters = new l, z = b.tokenize = function(a, c) {
                var d, e, f, g, h, i, j, k = S[a + " "];
                if (k) return c ? 0 : k.slice(0);
                for (h = a, i = [], j = w.preFilter; h;) {
                    (!d || (e = ia.exec(h))) && (e && (h = h.slice(e[0].length) || h), i.push(f = [])), d = !1, (e = ja.exec(h)) && (d = e.shift(), f.push({
                        value: d,
                        type: e[0].replace(ha, " ")
                    }), h = h.slice(d.length));
                    for (g in w.filter) !(e = na[g].exec(h)) || j[g] && !(e = j[g](e)) || (d = e.shift(), f.push({
                        value: d,
                        type: g,
                        matches: e
                    }), h = h.slice(d.length));
                    if (!d) break
                }
                return c ? h.length : h ? b.error(a) : S(a, i).slice(0)
            }, A = b.compile = function(a, b) {
                var c, d = [],
                    e = [],
                    f = T[a + " "];
                if (!f) {
                    for (b || (b = z(a)), c = b.length; c--;) f = s(b[c]), f[N] ? d.push(f) : e.push(f);
                    f = T(a, t(e, d)), f.selector = a
                }
                return f
            }, B = b.select = function(a, b, c, d) {
                var e, f, g, h, i, j = "function" == typeof a && a,
                    l = !d && z(a = j.selector || a);
                if (c = c || [], 1 === l.length) {
                    if (f = l[0] = l[0].slice(0), f.length > 2 && "ID" === (g = f[0]).type && v.getById && 9 === b.nodeType && I && w.relative[f[1].type]) {
                        if (b = (w.find.ID(g.matches[0].replace(ua, va), b) || [])[0], !b) return c;
                        j && (b = b.parentNode), a = a.slice(f.shift().value.length)
                    }
                    for (e = na.needsContext.test(a) ? 0 : f.length; e-- && (g = f[e], !w.relative[h = g.type]);)
                        if ((i = w.find[h]) && (d = i(g.matches[0].replace(ua, va), sa.test(f[0].type) && k(b.parentNode) || b))) {
                            if (f.splice(e, 1), a = d.length && m(f), !a) return $.apply(c, d), c;
                            break
                        }
                }
                return (j || A(a, l))(d, b, !I, c, !b || sa.test(a) && k(b.parentNode) || b), c
            }, v.sortStable = N.split("").sort(U).join("") === N, v.detectDuplicates = !!E, F(), v.sortDetached = e(function(a) {
                return 1 & a.compareDocumentPosition(G.createElement("div"))
            }), e(function(a) {
                return a.innerHTML = "<a href='#'></a>", "#" === a.firstChild.getAttribute("href")
            }) || f("type|href|height|width", function(a, b, c) {
                return c ? void 0 : a.getAttribute(b, "type" === b.toLowerCase() ? 1 : 2)
            }), v.attributes && e(function(a) {
                return a.innerHTML = "<input/>", a.firstChild.setAttribute("value", ""), "" === a.firstChild.getAttribute("value")
            }) || f("value", function(a, b, c) {
                return c || "input" !== a.nodeName.toLowerCase() ? void 0 : a.defaultValue
            }), e(function(a) {
                return null == a.getAttribute("disabled")
            }) || f(ba, function(a, b, c) {
                var d;
                return c ? void 0 : a[b] === !0 ? b.toLowerCase() : (d = a.getAttributeNode(b)) && d.specified ? d.value : null
            }), b
        }(a);
        fa.find = ka, fa.expr = ka.selectors, fa.expr[":"] = fa.expr.pseudos, fa.uniqueSort = fa.unique = ka.uniqueSort, fa.text = ka.getText, fa.isXMLDoc = ka.isXML, fa.contains = ka.contains;
        var la = function(a, b, c) {
                for (var d = [], e = void 0 !== c;
                    (a = a[b]) && 9 !== a.nodeType;)
                    if (1 === a.nodeType) {
                        if (e && fa(a).is(c)) break;
                        d.push(a)
                    }
                return d
            },
            ma = function(a, b) {
                for (var c = []; a; a = a.nextSibling) 1 === a.nodeType && a !== b && c.push(a);
                return c
            },
            na = fa.expr.match.needsContext,
            oa = /^<([\w-]+)\s*\/?>(?:<\/\1>|)$/,
            pa = /^.[^:#\[\.,]*$/;
        fa.filter = function(a, b, c) {
            var d = b[0];
            return c && (a = ":not(" + a + ")"), 1 === b.length && 1 === d.nodeType ? fa.find.matchesSelector(d, a) ? [d] : [] : fa.find.matches(a, fa.grep(b, function(a) {
                return 1 === a.nodeType
            }))
        }, fa.fn.extend({
            find: function(a) {
                var b, c = this.length,
                    d = [],
                    e = this;
                if ("string" != typeof a) return this.pushStack(fa(a).filter(function() {
                    for (b = 0; c > b; b++)
                        if (fa.contains(e[b], this)) return !0
                }));
                for (b = 0; c > b; b++) fa.find(a, e[b], d);
                return d = this.pushStack(c > 1 ? fa.unique(d) : d), d.selector = this.selector ? this.selector + " " + a : a, d
            },
            filter: function(a) {
                return this.pushStack(d(this, a || [], !1))
            },
            not: function(a) {
                return this.pushStack(d(this, a || [], !0))
            },
            is: function(a) {
                return !!d(this, "string" == typeof a && na.test(a) ? fa(a) : a || [], !1).length
            }
        });
        var qa, ra = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,
            sa = fa.fn.init = function(a, b, c) {
                var d, e;
                if (!a) return this;
                if (c = c || qa, "string" == typeof a) {
                    if (d = "<" === a[0] && ">" === a[a.length - 1] && a.length >= 3 ? [null, a, null] : ra.exec(a), !d || !d[1] && b) return !b || b.jquery ? (b || c).find(a) : this.constructor(b).find(a);
                    if (d[1]) {
                        if (b = b instanceof fa ? b[0] : b, fa.merge(this, fa.parseHTML(d[1], b && b.nodeType ? b.ownerDocument || b : X, !0)), oa.test(d[1]) && fa.isPlainObject(b))
                            for (d in b) fa.isFunction(this[d]) ? this[d](b[d]) : this.attr(d, b[d]);
                        return this
                    }
                    return e = X.getElementById(d[2]), e && e.parentNode && (this.length = 1, this[0] = e), this.context = X, this.selector = a, this
                }
                return a.nodeType ? (this.context = this[0] = a, this.length = 1, this) : fa.isFunction(a) ? void 0 !== c.ready ? c.ready(a) : a(fa) : (void 0 !== a.selector && (this.selector = a.selector, this.context = a.context), fa.makeArray(a, this))
            };
        sa.prototype = fa.fn, qa = fa(X);
        var ta = /^(?:parents|prev(?:Until|All))/,
            ua = {
                children: !0,
                contents: !0,
                next: !0,
                prev: !0
            };
        fa.fn.extend({
            has: function(a) {
                var b = fa(a, this),
                    c = b.length;
                return this.filter(function() {
                    for (var a = 0; c > a; a++)
                        if (fa.contains(this, b[a])) return !0
                })
            },
            closest: function(a, b) {
                for (var c, d = 0, e = this.length, f = [], g = na.test(a) || "string" != typeof a ? fa(a, b || this.context) : 0; e > d; d++)
                    for (c = this[d]; c && c !== b; c = c.parentNode)
                        if (c.nodeType < 11 && (g ? g.index(c) > -1 : 1 === c.nodeType && fa.find.matchesSelector(c, a))) {
                            f.push(c);
                            break
                        }
                return this.pushStack(f.length > 1 ? fa.uniqueSort(f) : f)
            },
            index: function(a) {
                return a ? "string" == typeof a ? _.call(fa(a), this[0]) : _.call(this, a.jquery ? a[0] : a) : this[0] && this[0].parentNode ? this.first().prevAll().length : -1
            },
            add: function(a, b) {
                return this.pushStack(fa.uniqueSort(fa.merge(this.get(), fa(a, b))))
            },
            addBack: function(a) {
                return this.add(null == a ? this.prevObject : this.prevObject.filter(a))
            }
        }), fa.each({
            parent: function(a) {
                var b = a.parentNode;
                return b && 11 !== b.nodeType ? b : null
            },
            parents: function(a) {
                return la(a, "parentNode")
            },
            parentsUntil: function(a, b, c) {
                return la(a, "parentNode", c)
            },
            next: function(a) {
                return e(a, "nextSibling")
            },
            prev: function(a) {
                return e(a, "previousSibling")
            },
            nextAll: function(a) {
                return la(a, "nextSibling")
            },
            prevAll: function(a) {
                return la(a, "previousSibling")
            },
            nextUntil: function(a, b, c) {
                return la(a, "nextSibling", c)
            },
            prevUntil: function(a, b, c) {
                return la(a, "previousSibling", c)
            },
            siblings: function(a) {
                return ma((a.parentNode || {}).firstChild, a)
            },
            children: function(a) {
                return ma(a.firstChild)
            },
            contents: function(a) {
                return a.contentDocument || fa.merge([], a.childNodes)
            }
        }, function(a, b) {
            fa.fn[a] = function(c, d) {
                var e = fa.map(this, b, c);
                return "Until" !== a.slice(-5) && (d = c), d && "string" == typeof d && (e = fa.filter(d, e)), this.length > 1 && (ua[a] || fa.uniqueSort(e), ta.test(a) && e.reverse()), this.pushStack(e)
            }
        });
        var va = /\S+/g;
        fa.Callbacks = function(a) {
            a = "string" == typeof a ? f(a) : fa.extend({}, a);
            var b, c, d, e, g = [],
                h = [],
                i = -1,
                j = function() {
                    for (e = a.once, d = b = !0; h.length; i = -1)
                        for (c = h.shift(); ++i < g.length;) g[i].apply(c[0], c[1]) === !1 && a.stopOnFalse && (i = g.length, c = !1);
                    a.memory || (c = !1), b = !1, e && (g = c ? [] : "")
                },
                k = {
                    add: function() {
                        return g && (c && !b && (i = g.length - 1, h.push(c)), function d(b) {
                            fa.each(b, function(b, c) {
                                fa.isFunction(c) ? a.unique && k.has(c) || g.push(c) : c && c.length && "string" !== fa.type(c) && d(c)
                            })
                        }(arguments), c && !b && j()), this
                    },
                    remove: function() {
                        return fa.each(arguments, function(a, b) {
                            for (var c;
                                (c = fa.inArray(b, g, c)) > -1;) g.splice(c, 1), i >= c && i--
                        }), this
                    },
                    has: function(a) {
                        return a ? fa.inArray(a, g) > -1 : g.length > 0
                    },
                    empty: function() {
                        return g && (g = []), this
                    },
                    disable: function() {
                        return e = h = [], g = c = "", this
                    },
                    disabled: function() {
                        return !g
                    },
                    lock: function() {
                        return e = h = [], c || (g = c = ""), this
                    },
                    locked: function() {
                        return !!e
                    },
                    fireWith: function(a, c) {
                        return e || (c = c || [], c = [a, c.slice ? c.slice() : c], h.push(c), b || j()), this
                    },
                    fire: function() {
                        return k.fireWith(this, arguments), this
                    },
                    fired: function() {
                        return !!d
                    }
                };
            return k
        }, fa.extend({
            Deferred: function(a) {
                var b = [
                        ["resolve", "done", fa.Callbacks("once memory"), "resolved"],
                        ["reject", "fail", fa.Callbacks("once memory"), "rejected"],
                        ["notify", "progress", fa.Callbacks("memory")]
                    ],
                    c = "pending",
                    d = {
                        state: function() {
                            return c
                        },
                        always: function() {
                            return e.done(arguments).fail(arguments), this
                        },
                        then: function() {
                            var a = arguments;
                            return fa.Deferred(function(c) {
                                fa.each(b, function(b, f) {
                                    var g = fa.isFunction(a[b]) && a[b];
                                    e[f[1]](function() {
                                        var a = g && g.apply(this, arguments);
                                        a && fa.isFunction(a.promise) ? a.promise().progress(c.notify).done(c.resolve).fail(c.reject) : c[f[0] + "With"](this === d ? c.promise() : this, g ? [a] : arguments)
                                    })
                                }), a = null
                            }).promise()
                        },
                        promise: function(a) {
                            return null != a ? fa.extend(a, d) : d
                        }
                    },
                    e = {};
                return d.pipe = d.then, fa.each(b, function(a, f) {
                    var g = f[2],
                        h = f[3];
                    d[f[1]] = g.add, h && g.add(function() {
                        c = h
                    }, b[1 ^ a][2].disable, b[2][2].lock), e[f[0]] = function() {
                        return e[f[0] + "With"](this === e ? d : this, arguments), this
                    }, e[f[0] + "With"] = g.fireWith
                }), d.promise(e), a && a.call(e, e), e
            },
            when: function(a) {
                var b, c, d, e = 0,
                    f = Y.call(arguments),
                    g = f.length,
                    h = 1 !== g || a && fa.isFunction(a.promise) ? g : 0,
                    i = 1 === h ? a : fa.Deferred(),
                    j = function(a, c, d) {
                        return function(e) {
                            c[a] = this, d[a] = arguments.length > 1 ? Y.call(arguments) : e, d === b ? i.notifyWith(c, d) : --h || i.resolveWith(c, d)
                        }
                    };
                if (g > 1)
                    for (b = new Array(g), c = new Array(g), d = new Array(g); g > e; e++) f[e] && fa.isFunction(f[e].promise) ? f[e].promise().progress(j(e, c, b)).done(j(e, d, f)).fail(i.reject) : --h;
                return h || i.resolveWith(d, f), i.promise()
            }
        });
        var wa;
        fa.fn.ready = function(a) {
            return fa.ready.promise().done(a), this
        }, fa.extend({
            isReady: !1,
            readyWait: 1,
            holdReady: function(a) {
                a ? fa.readyWait++ : fa.ready(!0)
            },
            ready: function(a) {
                (a === !0 ? --fa.readyWait : fa.isReady) || (fa.isReady = !0, a !== !0 && --fa.readyWait > 0 || (wa.resolveWith(X, [fa]), fa.fn.triggerHandler && (fa(X).triggerHandler("ready"), fa(X).off("ready"))))
            }
        }), fa.ready.promise = function(b) {
            return wa || (wa = fa.Deferred(), "complete" === X.readyState || "loading" !== X.readyState && !X.documentElement.doScroll ? a.setTimeout(fa.ready) : (X.addEventListener("DOMContentLoaded", g), a.addEventListener("load", g))), wa.promise(b)
        }, fa.ready.promise();
        var xa = function(a, b, c, d, e, f, g) {
                var h = 0,
                    i = a.length,
                    j = null == c;
                if ("object" === fa.type(c)) {
                    e = !0;
                    for (h in c) xa(a, b, h, c[h], !0, f, g)
                } else if (void 0 !== d && (e = !0, fa.isFunction(d) || (g = !0), j && (g ? (b.call(a, d), b = null) : (j = b, b = function(a, b, c) {
                        return j.call(fa(a), c)
                    })), b))
                    for (; i > h; h++) b(a[h], c, g ? d : d.call(a[h], h, b(a[h], c)));
                return e ? a : j ? b.call(a) : i ? b(a[0], c) : f
            },
            ya = function(a) {
                return 1 === a.nodeType || 9 === a.nodeType || !+a.nodeType
            };
        h.uid = 1, h.prototype = {
            register: function(a, b) {
                var c = b || {};
                return a.nodeType ? a[this.expando] = c : Object.defineProperty(a, this.expando, {
                    value: c,
                    writable: !0,
                    configurable: !0
                }), a[this.expando]
            },
            cache: function(a) {
                if (!ya(a)) return {};
                var b = a[this.expando];
                return b || (b = {}, ya(a) && (a.nodeType ? a[this.expando] = b : Object.defineProperty(a, this.expando, {
                    value: b,
                    configurable: !0
                }))), b
            },
            set: function(a, b, c) {
                var d, e = this.cache(a);
                if ("string" == typeof b) e[b] = c;
                else
                    for (d in b) e[d] = b[d];
                return e
            },
            get: function(a, b) {
                return void 0 === b ? this.cache(a) : a[this.expando] && a[this.expando][b]
            },
            access: function(a, b, c) {
                var d;
                return void 0 === b || b && "string" == typeof b && void 0 === c ? (d = this.get(a, b), void 0 !== d ? d : this.get(a, fa.camelCase(b))) : (this.set(a, b, c), void 0 !== c ? c : b)
            },
            remove: function(a, b) {
                var c, d, e, f = a[this.expando];
                if (void 0 !== f) {
                    if (void 0 === b) this.register(a);
                    else {
                        fa.isArray(b) ? d = b.concat(b.map(fa.camelCase)) : (e = fa.camelCase(b), b in f ? d = [b, e] : (d = e, d = d in f ? [d] : d.match(va) || [])), c = d.length;
                        for (; c--;) delete f[d[c]]
                    }(void 0 === b || fa.isEmptyObject(f)) && (a.nodeType ? a[this.expando] = void 0 : delete a[this.expando])
                }
            },
            hasData: function(a) {
                var b = a[this.expando];
                return void 0 !== b && !fa.isEmptyObject(b)
            }
        };
        var za = new h,
            Aa = new h,
            Ba = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
            Ca = /[A-Z]/g;
        fa.extend({
            hasData: function(a) {
                return Aa.hasData(a) || za.hasData(a)
            },
            data: function(a, b, c) {
                return Aa.access(a, b, c)
            },
            removeData: function(a, b) {
                Aa.remove(a, b)
            },
            _data: function(a, b, c) {
                return za.access(a, b, c)
            },
            _removeData: function(a, b) {
                za.remove(a, b)
            }
        }), fa.fn.extend({
            data: function(a, b) {
                var c, d, e, f = this[0],
                    g = f && f.attributes;
                if (void 0 === a) {
                    if (this.length && (e = Aa.get(f), 1 === f.nodeType && !za.get(f, "hasDataAttrs"))) {
                        for (c = g.length; c--;) g[c] && (d = g[c].name, 0 === d.indexOf("data-") && (d = fa.camelCase(d.slice(5)), i(f, d, e[d])));
                        za.set(f, "hasDataAttrs", !0)
                    }
                    return e
                }
                return "object" == typeof a ? this.each(function() {
                    Aa.set(this, a)
                }) : xa(this, function(b) {
                    var c, d;
                    if (f && void 0 === b) {
                        if (c = Aa.get(f, a) || Aa.get(f, a.replace(Ca, "-$&").toLowerCase()), void 0 !== c) return c;
                        if (d = fa.camelCase(a), c = Aa.get(f, d), void 0 !== c) return c;
                        if (c = i(f, d, void 0), void 0 !== c) return c
                    } else d = fa.camelCase(a), this.each(function() {
                        var c = Aa.get(this, d);
                        Aa.set(this, d, b), a.indexOf("-") > -1 && void 0 !== c && Aa.set(this, a, b)
                    })
                }, null, b, arguments.length > 1, null, !0)
            },
            removeData: function(a) {
                return this.each(function() {
                    Aa.remove(this, a)
                })
            }
        }), fa.extend({
            queue: function(a, b, c) {
                var d;
                return a ? (b = (b || "fx") + "queue", d = za.get(a, b), c && (!d || fa.isArray(c) ? d = za.access(a, b, fa.makeArray(c)) : d.push(c)), d || []) : void 0
            },
            dequeue: function(a, b) {
                b = b || "fx";
                var c = fa.queue(a, b),
                    d = c.length,
                    e = c.shift(),
                    f = fa._queueHooks(a, b),
                    g = function() {
                        fa.dequeue(a, b)
                    };
                "inprogress" === e && (e = c.shift(), d--), e && ("fx" === b && c.unshift("inprogress"), delete f.stop, e.call(a, g, f)), !d && f && f.empty.fire()
            },
            _queueHooks: function(a, b) {
                var c = b + "queueHooks";
                return za.get(a, c) || za.access(a, c, {
                    empty: fa.Callbacks("once memory").add(function() {
                        za.remove(a, [b + "queue", c])
                    })
                })
            }
        }), fa.fn.extend({
            queue: function(a, b) {
                var c = 2;
                return "string" != typeof a && (b = a, a = "fx", c--), arguments.length < c ? fa.queue(this[0], a) : void 0 === b ? this : this.each(function() {
                    var c = fa.queue(this, a, b);
                    fa._queueHooks(this, a), "fx" === a && "inprogress" !== c[0] && fa.dequeue(this, a)
                })
            },
            dequeue: function(a) {
                return this.each(function() {
                    fa.dequeue(this, a)
                })
            },
            clearQueue: function(a) {
                return this.queue(a || "fx", [])
            },
            promise: function(a, b) {
                var c, d = 1,
                    e = fa.Deferred(),
                    f = this,
                    g = this.length,
                    h = function() {
                        --d || e.resolveWith(f, [f])
                    };
                for ("string" != typeof a && (b = a, a = void 0), a = a || "fx"; g--;) c = za.get(f[g], a + "queueHooks"), c && c.empty && (d++, c.empty.add(h));
                return h(), e.promise(b)
            }
        });
        var Da = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,
            Ea = new RegExp("^(?:([+-])=|)(" + Da + ")([a-z%]*)$", "i"),
            Fa = ["Top", "Right", "Bottom", "Left"],
            Ga = function(a, b) {
                return a = b || a, "none" === fa.css(a, "display") || !fa.contains(a.ownerDocument, a)
            },
            Ha = /^(?:checkbox|radio)$/i,
            Ia = /<([\w:-]+)/,
            Ja = /^$|\/(?:java|ecma)script/i,
            Ka = {
                option: [1, "<select multiple='multiple'>", "</select>"],
                thead: [1, "<table>", "</table>"],
                col: [2, "<table><colgroup>", "</colgroup></table>"],
                tr: [2, "<table><tbody>", "</tbody></table>"],
                td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
                _default: [0, "", ""]
            };
        Ka.optgroup = Ka.option, Ka.tbody = Ka.tfoot = Ka.colgroup = Ka.caption = Ka.thead, Ka.th = Ka.td;
        var La = /<|&#?\w+;/;
        ! function() {
            var a = X.createDocumentFragment(),
                b = a.appendChild(X.createElement("div")),
                c = X.createElement("input");
            c.setAttribute("type", "radio"), c.setAttribute("checked", "checked"), c.setAttribute("name", "t"), b.appendChild(c), da.checkClone = b.cloneNode(!0).cloneNode(!0).lastChild.checked, b.innerHTML = "<textarea>x</textarea>", da.noCloneChecked = !!b.cloneNode(!0).lastChild.defaultValue
        }();
        var Ma = /^key/,
            Na = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
            Oa = /^([^.]*)(?:\.(.+)|)/;
        fa.event = {
            global: {},
            add: function(a, b, c, d, e) {
                var f, g, h, i, j, k, l, m, n, o, p, q = za.get(a);
                if (q)
                    for (c.handler && (f = c, c = f.handler, e = f.selector), c.guid || (c.guid = fa.guid++), (i = q.events) || (i = q.events = {}), (g = q.handle) || (g = q.handle = function(b) {
                            return "undefined" != typeof fa && fa.event.triggered !== b.type ? fa.event.dispatch.apply(a, arguments) : void 0
                        }), b = (b || "").match(va) || [""], j = b.length; j--;) h = Oa.exec(b[j]) || [], n = p = h[1], o = (h[2] || "").split(".").sort(), n && (l = fa.event.special[n] || {}, n = (e ? l.delegateType : l.bindType) || n, l = fa.event.special[n] || {}, k = fa.extend({
                        type: n,
                        origType: p,
                        data: d,
                        handler: c,
                        guid: c.guid,
                        selector: e,
                        needsContext: e && fa.expr.match.needsContext.test(e),
                        namespace: o.join(".")
                    }, f), (m = i[n]) || (m = i[n] = [], m.delegateCount = 0, l.setup && l.setup.call(a, d, o, g) !== !1 || a.addEventListener && a.addEventListener(n, g)), l.add && (l.add.call(a, k), k.handler.guid || (k.handler.guid = c.guid)), e ? m.splice(m.delegateCount++, 0, k) : m.push(k), fa.event.global[n] = !0)
            },
            remove: function(a, b, c, d, e) {
                var f, g, h, i, j, k, l, m, n, o, p, q = za.hasData(a) && za.get(a);
                if (q && (i = q.events)) {
                    for (b = (b || "").match(va) || [""], j = b.length; j--;)
                        if (h = Oa.exec(b[j]) || [], n = p = h[1], o = (h[2] || "").split(".").sort(), n) {
                            for (l = fa.event.special[n] || {}, n = (d ? l.delegateType : l.bindType) || n, m = i[n] || [], h = h[2] && new RegExp("(^|\\.)" + o.join("\\.(?:.*\\.|)") + "(\\.|$)"), g = f = m.length; f--;) k = m[f], !e && p !== k.origType || c && c.guid !== k.guid || h && !h.test(k.namespace) || d && d !== k.selector && ("**" !== d || !k.selector) || (m.splice(f, 1), k.selector && m.delegateCount--, l.remove && l.remove.call(a, k));
                            g && !m.length && (l.teardown && l.teardown.call(a, o, q.handle) !== !1 || fa.removeEvent(a, n, q.handle), delete i[n])
                        } else
                            for (n in i) fa.event.remove(a, n + b[j], c, d, !0);
                    fa.isEmptyObject(i) && za.remove(a, "handle events")
                }
            },
            dispatch: function(a) {
                a = fa.event.fix(a);
                var b, c, d, e, f, g = [],
                    h = Y.call(arguments),
                    i = (za.get(this, "events") || {})[a.type] || [],
                    j = fa.event.special[a.type] || {};
                if (h[0] = a, a.delegateTarget = this, !j.preDispatch || j.preDispatch.call(this, a) !== !1) {
                    for (g = fa.event.handlers.call(this, a, i), b = 0;
                        (e = g[b++]) && !a.isPropagationStopped();)
                        for (a.currentTarget = e.elem, c = 0;
                            (f = e.handlers[c++]) && !a.isImmediatePropagationStopped();)(!a.rnamespace || a.rnamespace.test(f.namespace)) && (a.handleObj = f, a.data = f.data, d = ((fa.event.special[f.origType] || {}).handle || f.handler).apply(e.elem, h), void 0 !== d && (a.result = d) === !1 && (a.preventDefault(), a.stopPropagation()));
                    return j.postDispatch && j.postDispatch.call(this, a), a.result
                }
            },
            handlers: function(a, b) {
                var c, d, e, f, g = [],
                    h = b.delegateCount,
                    i = a.target;
                if (h && i.nodeType && ("click" !== a.type || isNaN(a.button) || a.button < 1))
                    for (; i !== this; i = i.parentNode || this)
                        if (1 === i.nodeType && (i.disabled !== !0 || "click" !== a.type)) {
                            for (d = [], c = 0; h > c; c++) f = b[c], e = f.selector + " ", void 0 === d[e] && (d[e] = f.needsContext ? fa(e, this).index(i) > -1 : fa.find(e, this, null, [i]).length), d[e] && d.push(f);
                            d.length && g.push({
                                elem: i,
                                handlers: d
                            })
                        }
                return h < b.length && g.push({
                    elem: this,
                    handlers: b.slice(h)
                }), g
            },
            props: "altKey bubbles cancelable ctrlKey currentTarget detail eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),
            fixHooks: {},
            keyHooks: {
                props: "char charCode key keyCode".split(" "),
                filter: function(a, b) {
                    return null == a.which && (a.which = null != b.charCode ? b.charCode : b.keyCode), a
                }
            },
            mouseHooks: {
                props: "button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
                filter: function(a, b) {
                    var c, d, e, f = b.button;
                    return null == a.pageX && null != b.clientX && (c = a.target.ownerDocument || X, d = c.documentElement, e = c.body, a.pageX = b.clientX + (d && d.scrollLeft || e && e.scrollLeft || 0) - (d && d.clientLeft || e && e.clientLeft || 0), a.pageY = b.clientY + (d && d.scrollTop || e && e.scrollTop || 0) - (d && d.clientTop || e && e.clientTop || 0)), a.which || void 0 === f || (a.which = 1 & f ? 1 : 2 & f ? 3 : 4 & f ? 2 : 0), a
                }
            },
            fix: function(a) {
                if (a[fa.expando]) return a;
                var b, c, d, e = a.type,
                    f = a,
                    g = this.fixHooks[e];
                for (g || (this.fixHooks[e] = g = Na.test(e) ? this.mouseHooks : Ma.test(e) ? this.keyHooks : {}), d = g.props ? this.props.concat(g.props) : this.props, a = new fa.Event(f), b = d.length; b--;) c = d[b], a[c] = f[c];
                return a.target || (a.target = X), 3 === a.target.nodeType && (a.target = a.target.parentNode), g.filter ? g.filter(a, f) : a
            },
            special: {
                load: {
                    noBubble: !0
                },
                focus: {
                    trigger: function() {
                        return this !== p() && this.focus ? (this.focus(), !1) : void 0
                    },
                    delegateType: "focusin"
                },
                blur: {
                    trigger: function() {
                        return this === p() && this.blur ? (this.blur(), !1) : void 0
                    },
                    delegateType: "focusout"
                },
                click: {
                    trigger: function() {
                        return "checkbox" === this.type && this.click && fa.nodeName(this, "input") ? (this.click(), !1) : void 0
                    },
                    _default: function(a) {
                        return fa.nodeName(a.target, "a")
                    }
                },
                beforeunload: {
                    postDispatch: function(a) {
                        void 0 !== a.result && a.originalEvent && (a.originalEvent.returnValue = a.result)
                    }
                }
            }
        }, fa.removeEvent = function(a, b, c) {
            a.removeEventListener && a.removeEventListener(b, c)
        }, fa.Event = function(a, b) {
            return this instanceof fa.Event ? (a && a.type ? (this.originalEvent = a, this.type = a.type, this.isDefaultPrevented = a.defaultPrevented || void 0 === a.defaultPrevented && a.returnValue === !1 ? n : o) : this.type = a, b && fa.extend(this, b), this.timeStamp = a && a.timeStamp || fa.now(), void(this[fa.expando] = !0)) : new fa.Event(a, b)
        }, fa.Event.prototype = {
            constructor: fa.Event,
            isDefaultPrevented: o,
            isPropagationStopped: o,
            isImmediatePropagationStopped: o,
            preventDefault: function() {
                var a = this.originalEvent;
                this.isDefaultPrevented = n, a && a.preventDefault()
            },
            stopPropagation: function() {
                var a = this.originalEvent;
                this.isPropagationStopped = n, a && a.stopPropagation()
            },
            stopImmediatePropagation: function() {
                var a = this.originalEvent;
                this.isImmediatePropagationStopped = n, a && a.stopImmediatePropagation(), this.stopPropagation()
            }
        }, fa.each({
            mouseenter: "mouseover",
            mouseleave: "mouseout",
            pointerenter: "pointerover",
            pointerleave: "pointerout"
        }, function(a, b) {
            fa.event.special[a] = {
                delegateType: b,
                bindType: b,
                handle: function(a) {
                    var c, d = this,
                        e = a.relatedTarget,
                        f = a.handleObj;
                    return (!e || e !== d && !fa.contains(d, e)) && (a.type = f.origType, c = f.handler.apply(this, arguments), a.type = b), c
                }
            }
        }), fa.fn.extend({
            on: function(a, b, c, d) {
                return q(this, a, b, c, d)
            },
            one: function(a, b, c, d) {
                return q(this, a, b, c, d, 1)
            },
            off: function(a, b, c) {
                var d, e;
                if (a && a.preventDefault && a.handleObj) return d = a.handleObj, fa(a.delegateTarget).off(d.namespace ? d.origType + "." + d.namespace : d.origType, d.selector, d.handler), this;
                if ("object" == typeof a) {
                    for (e in a) this.off(e, b, a[e]);
                    return this
                }
                return (b === !1 || "function" == typeof b) && (c = b, b = void 0), c === !1 && (c = o), this.each(function() {
                    fa.event.remove(this, a, c, b)
                })
            }
        });
        var Pa = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:-]+)[^>]*)\/>/gi,
            Qa = /<script|<style|<link/i,
            Ra = /checked\s*(?:[^=]|=\s*.checked.)/i,
            Sa = /^true\/(.*)/,
            Ta = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;
        fa.extend({
            htmlPrefilter: function(a) {
                return a.replace(Pa, "<$1></$2>")
            },
            clone: function(a, b, c) {
                var d, e, f, g, h = a.cloneNode(!0),
                    i = fa.contains(a.ownerDocument, a);
                if (!(da.noCloneChecked || 1 !== a.nodeType && 11 !== a.nodeType || fa.isXMLDoc(a)))
                    for (g = k(h), f = k(a), d = 0, e = f.length; e > d; d++) v(f[d], g[d]);
                if (b)
                    if (c)
                        for (f = f || k(a), g = g || k(h), d = 0, e = f.length; e > d; d++) u(f[d], g[d]);
                    else u(a, h);
                return g = k(h, "script"), g.length > 0 && l(g, !i && k(a, "script")), h
            },
            cleanData: function(a) {
                for (var b, c, d, e = fa.event.special, f = 0; void 0 !== (c = a[f]); f++)
                    if (ya(c)) {
                        if (b = c[za.expando]) {
                            if (b.events)
                                for (d in b.events) e[d] ? fa.event.remove(c, d) : fa.removeEvent(c, d, b.handle);
                            c[za.expando] = void 0
                        }
                        c[Aa.expando] && (c[Aa.expando] = void 0)
                    }
            }
        }), fa.fn.extend({
            domManip: w,
            detach: function(a) {
                return x(this, a, !0)
            },
            remove: function(a) {
                return x(this, a)
            },
            text: function(a) {
                return xa(this, function(a) {
                    return void 0 === a ? fa.text(this) : this.empty().each(function() {
                        (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) && (this.textContent = a)
                    })
                }, null, a, arguments.length)
            },
            append: function() {
                return w(this, arguments, function(a) {
                    if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
                        var b = r(this, a);
                        b.appendChild(a)
                    }
                })
            },
            prepend: function() {
                return w(this, arguments, function(a) {
                    if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
                        var b = r(this, a);
                        b.insertBefore(a, b.firstChild)
                    }
                })
            },
            before: function() {
                return w(this, arguments, function(a) {
                    this.parentNode && this.parentNode.insertBefore(a, this)
                })
            },
            after: function() {
                return w(this, arguments, function(a) {
                    this.parentNode && this.parentNode.insertBefore(a, this.nextSibling)
                })
            },
            empty: function() {
                for (var a, b = 0; null != (a = this[b]); b++) 1 === a.nodeType && (fa.cleanData(k(a, !1)), a.textContent = "");
                return this
            },
            clone: function(a, b) {
                return a = null == a ? !1 : a, b = null == b ? a : b, this.map(function() {
                    return fa.clone(this, a, b)
                })
            },
            html: function(a) {
                return xa(this, function(a) {
                    var b = this[0] || {},
                        c = 0,
                        d = this.length;
                    if (void 0 === a && 1 === b.nodeType) return b.innerHTML;
                    if ("string" == typeof a && !Qa.test(a) && !Ka[(Ia.exec(a) || ["", ""])[1].toLowerCase()]) {
                        a = fa.htmlPrefilter(a);
                        try {
                            for (; d > c; c++) b = this[c] || {}, 1 === b.nodeType && (fa.cleanData(k(b, !1)), b.innerHTML = a);
                            b = 0
                        } catch (e) {}
                    }
                    b && this.empty().append(a)
                }, null, a, arguments.length)
            },
            replaceWith: function() {
                var a = [];
                return w(this, arguments, function(b) {
                    var c = this.parentNode;
                    fa.inArray(this, a) < 0 && (fa.cleanData(k(this)), c && c.replaceChild(b, this))
                }, a)
            }
        }), fa.each({
            appendTo: "append",
            prependTo: "prepend",
            insertBefore: "before",
            insertAfter: "after",
            replaceAll: "replaceWith"
        }, function(a, b) {
            fa.fn[a] = function(a) {
                for (var c, d = [], e = fa(a), f = e.length - 1, g = 0; f >= g; g++) c = g === f ? this : this.clone(!0), fa(e[g])[b](c), $.apply(d, c.get());
                return this.pushStack(d)
            }
        });
        var Ua, Va = {
                HTML: "block",
                BODY: "block"
            },
            Wa = /^margin/,
            Xa = new RegExp("^(" + Da + ")(?!px)[a-z%]+$", "i"),
            Ya = function(b) {
                var c = b.ownerDocument.defaultView;
                return c.opener || (c = a), c.getComputedStyle(b)
            },
            Za = function(a, b, c, d) {
                var e, f, g = {};
                for (f in b) g[f] = a.style[f], a.style[f] = b[f];
                e = c.apply(a, d || []);
                for (f in b) a.style[f] = g[f];
                return e
            },
            $a = X.documentElement;
        ! function() {
            function b() {
                h.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:relative;display:block;margin:auto;border:1px;padding:1px;top:1%;width:50%", h.innerHTML = "", $a.appendChild(g);
                var b = a.getComputedStyle(h);
                c = "1%" !== b.top, f = "2px" === b.marginLeft, d = "4px" === b.width, h.style.marginRight = "50%", e = "4px" === b.marginRight, $a.removeChild(g)
            }
            var c, d, e, f, g = X.createElement("div"),
                h = X.createElement("div");
            h.style && (h.style.backgroundClip = "content-box", h.cloneNode(!0).style.backgroundClip = "", da.clearCloneStyle = "content-box" === h.style.backgroundClip, g.style.cssText = "border:0;width:8px;height:0;top:0;left:-9999px;padding:0;margin-top:1px;position:absolute", g.appendChild(h), fa.extend(da, {
                pixelPosition: function() {
                    return b(), c
                },
                boxSizingReliable: function() {
                    return null == d && b(), d
                },
                pixelMarginRight: function() {
                    return null == d && b(), e
                },
                reliableMarginLeft: function() {
                    return null == d && b(), f
                },
                reliableMarginRight: function() {
                    var b, c = h.appendChild(X.createElement("div"));
                    return c.style.cssText = h.style.cssText = "-webkit-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0", c.style.marginRight = c.style.width = "0", h.style.width = "1px", $a.appendChild(g), b = !parseFloat(a.getComputedStyle(c).marginRight), $a.removeChild(g), h.removeChild(c), b
                }
            }))
        }();
        var _a = /^(none|table(?!-c[ea]).+)/,
            ab = {
                position: "absolute",
                visibility: "hidden",
                display: "block"
            },
            bb = {
                letterSpacing: "0",
                fontWeight: "400"
            },
            cb = ["Webkit", "O", "Moz", "ms"],
            db = X.createElement("div").style;
        fa.extend({
            cssHooks: {
                opacity: {
                    get: function(a, b) {
                        if (b) {
                            var c = A(a, "opacity");
                            return "" === c ? "1" : c
                        }
                    }
                }
            },
            cssNumber: {
                animationIterationCount: !0,
                columnCount: !0,
                fillOpacity: !0,
                flexGrow: !0,
                flexShrink: !0,
                fontWeight: !0,
                lineHeight: !0,
                opacity: !0,
                order: !0,
                orphans: !0,
                widows: !0,
                zIndex: !0,
                zoom: !0
            },
            cssProps: {
                "float": "cssFloat"
            },
            style: function(a, b, c, d) {
                if (a && 3 !== a.nodeType && 8 !== a.nodeType && a.style) {
                    var e, f, g, h = fa.camelCase(b),
                        i = a.style;
                    return b = fa.cssProps[h] || (fa.cssProps[h] = C(h) || h), g = fa.cssHooks[b] || fa.cssHooks[h], void 0 === c ? g && "get" in g && void 0 !== (e = g.get(a, !1, d)) ? e : i[b] : (f = typeof c, "string" === f && (e = Ea.exec(c)) && e[1] && (c = j(a, b, e), f = "number"), void(null != c && c === c && ("number" === f && (c += e && e[3] || (fa.cssNumber[h] ? "" : "px")), da.clearCloneStyle || "" !== c || 0 !== b.indexOf("background") || (i[b] = "inherit"), g && "set" in g && void 0 === (c = g.set(a, c, d)) || (i[b] = c))))
                }
            },
            css: function(a, b, c, d) {
                var e, f, g, h = fa.camelCase(b);
                return b = fa.cssProps[h] || (fa.cssProps[h] = C(h) || h), g = fa.cssHooks[b] || fa.cssHooks[h], g && "get" in g && (e = g.get(a, !0, c)), void 0 === e && (e = A(a, b, d)), "normal" === e && b in bb && (e = bb[b]), "" === c || c ? (f = parseFloat(e), c === !0 || isFinite(f) ? f || 0 : e) : e
            }
        }), fa.each(["height", "width"], function(a, b) {
            fa.cssHooks[b] = {
                get: function(a, c, d) {
                    return c ? _a.test(fa.css(a, "display")) && 0 === a.offsetWidth ? Za(a, ab, function() {
                        return F(a, b, d)
                    }) : F(a, b, d) : void 0
                },
                set: function(a, c, d) {
                    var e, f = d && Ya(a),
                        g = d && E(a, b, d, "border-box" === fa.css(a, "boxSizing", !1, f), f);
                    return g && (e = Ea.exec(c)) && "px" !== (e[3] || "px") && (a.style[b] = c, c = fa.css(a, b)), D(a, c, g)
                }
            }
        }), fa.cssHooks.marginLeft = B(da.reliableMarginLeft, function(a, b) {
            return b ? (parseFloat(A(a, "marginLeft")) || a.getBoundingClientRect().left - Za(a, {
                marginLeft: 0
            }, function() {
                return a.getBoundingClientRect().left
            })) + "px" : void 0
        }), fa.cssHooks.marginRight = B(da.reliableMarginRight, function(a, b) {
            return b ? Za(a, {
                display: "inline-block"
            }, A, [a, "marginRight"]) : void 0
        }), fa.each({
            margin: "",
            padding: "",
            border: "Width"
        }, function(a, b) {
            fa.cssHooks[a + b] = {
                expand: function(c) {
                    for (var d = 0, e = {}, f = "string" == typeof c ? c.split(" ") : [c]; 4 > d; d++) e[a + Fa[d] + b] = f[d] || f[d - 2] || f[0];
                    return e
                }
            }, Wa.test(a) || (fa.cssHooks[a + b].set = D)
        }), fa.fn.extend({
            css: function(a, b) {
                return xa(this, function(a, b, c) {
                    var d, e, f = {},
                        g = 0;
                    if (fa.isArray(b)) {
                        for (d = Ya(a), e = b.length; e > g; g++) f[b[g]] = fa.css(a, b[g], !1, d);
                        return f
                    }
                    return void 0 !== c ? fa.style(a, b, c) : fa.css(a, b)
                }, a, b, arguments.length > 1)
            },
            show: function() {
                return G(this, !0)
            },
            hide: function() {
                return G(this)
            },
            toggle: function(a) {
                return "boolean" == typeof a ? a ? this.show() : this.hide() : this.each(function() {
                    Ga(this) ? fa(this).show() : fa(this).hide()
                })
            }
        }), fa.Tween = H, H.prototype = {
            constructor: H,
            init: function(a, b, c, d, e, f) {
                this.elem = a, this.prop = c, this.easing = e || fa.easing._default, this.options = b, this.start = this.now = this.cur(), this.end = d, this.unit = f || (fa.cssNumber[c] ? "" : "px")
            },
            cur: function() {
                var a = H.propHooks[this.prop];
                return a && a.get ? a.get(this) : H.propHooks._default.get(this)
            },
            run: function(a) {
                var b, c = H.propHooks[this.prop];
                return this.options.duration ? this.pos = b = fa.easing[this.easing](a, this.options.duration * a, 0, 1, this.options.duration) : this.pos = b = a, this.now = (this.end - this.start) * b + this.start, this.options.step && this.options.step.call(this.elem, this.now, this), c && c.set ? c.set(this) : H.propHooks._default.set(this), this
            }
        }, H.prototype.init.prototype = H.prototype, H.propHooks = {
            _default: {
                get: function(a) {
                    var b;
                    return 1 !== a.elem.nodeType || null != a.elem[a.prop] && null == a.elem.style[a.prop] ? a.elem[a.prop] : (b = fa.css(a.elem, a.prop, ""), b && "auto" !== b ? b : 0)
                },
                set: function(a) {
                    fa.fx.step[a.prop] ? fa.fx.step[a.prop](a) : 1 !== a.elem.nodeType || null == a.elem.style[fa.cssProps[a.prop]] && !fa.cssHooks[a.prop] ? a.elem[a.prop] = a.now : fa.style(a.elem, a.prop, a.now + a.unit)
                }
            }
        }, H.propHooks.scrollTop = H.propHooks.scrollLeft = {
            set: function(a) {
                a.elem.nodeType && a.elem.parentNode && (a.elem[a.prop] = a.now)
            }
        }, fa.easing = {
            linear: function(a) {
                return a
            },
            swing: function(a) {
                return .5 - Math.cos(a * Math.PI) / 2
            },
            _default: "swing"
        }, fa.fx = H.prototype.init, fa.fx.step = {};
        var eb, fb, gb = /^(?:toggle|show|hide)$/,
            hb = /queueHooks$/;
        fa.Animation = fa.extend(N, {
                tweeners: {
                    "*": [function(a, b) {
                        var c = this.createTween(a, b);
                        return j(c.elem, a, Ea.exec(b), c), c
                    }]
                },
                tweener: function(a, b) {
                    fa.isFunction(a) ? (b = a, a = ["*"]) : a = a.match(va);
                    for (var c, d = 0, e = a.length; e > d; d++) c = a[d], N.tweeners[c] = N.tweeners[c] || [], N.tweeners[c].unshift(b)
                },
                prefilters: [L],
                prefilter: function(a, b) {
                    b ? N.prefilters.unshift(a) : N.prefilters.push(a)
                }
            }), fa.speed = function(a, b, c) {
                var d = a && "object" == typeof a ? fa.extend({}, a) : {
                    complete: c || !c && b || fa.isFunction(a) && a,
                    duration: a,
                    easing: c && b || b && !fa.isFunction(b) && b
                };
                return d.duration = fa.fx.off ? 0 : "number" == typeof d.duration ? d.duration : d.duration in fa.fx.speeds ? fa.fx.speeds[d.duration] : fa.fx.speeds._default, (null == d.queue || d.queue === !0) && (d.queue = "fx"), d.old = d.complete, d.complete = function() {
                    fa.isFunction(d.old) && d.old.call(this), d.queue && fa.dequeue(this, d.queue)
                }, d
            }, fa.fn.extend({
                fadeTo: function(a, b, c, d) {
                    return this.filter(Ga).css("opacity", 0).show().end().animate({
                        opacity: b
                    }, a, c, d)
                },
                animate: function(a, b, c, d) {
                    var e = fa.isEmptyObject(a),
                        f = fa.speed(b, c, d),
                        g = function() {
                            var b = N(this, fa.extend({}, a), f);
                            (e || za.get(this, "finish")) && b.stop(!0)
                        };
                    return g.finish = g, e || f.queue === !1 ? this.each(g) : this.queue(f.queue, g)
                },
                stop: function(a, b, c) {
                    var d = function(a) {
                        var b = a.stop;
                        delete a.stop, b(c)
                    };
                    return "string" != typeof a && (c = b, b = a, a = void 0), b && a !== !1 && this.queue(a || "fx", []), this.each(function() {
                        var b = !0,
                            e = null != a && a + "queueHooks",
                            f = fa.timers,
                            g = za.get(this);
                        if (e) g[e] && g[e].stop && d(g[e]);
                        else
                            for (e in g) g[e] && g[e].stop && hb.test(e) && d(g[e]);
                        for (e = f.length; e--;) f[e].elem !== this || null != a && f[e].queue !== a || (f[e].anim.stop(c), b = !1, f.splice(e, 1));
                        (b || !c) && fa.dequeue(this, a)
                    })
                },
                finish: function(a) {
                    return a !== !1 && (a = a || "fx"), this.each(function() {
                        var b, c = za.get(this),
                            d = c[a + "queue"],
                            e = c[a + "queueHooks"],
                            f = fa.timers,
                            g = d ? d.length : 0;
                        for (c.finish = !0, fa.queue(this, a, []), e && e.stop && e.stop.call(this, !0), b = f.length; b--;) f[b].elem === this && f[b].queue === a && (f[b].anim.stop(!0), f.splice(b, 1));
                        for (b = 0; g > b; b++) d[b] && d[b].finish && d[b].finish.call(this);
                        delete c.finish
                    })
                }
            }), fa.each(["toggle", "show", "hide"], function(a, b) {
                var c = fa.fn[b];
                fa.fn[b] = function(a, d, e) {
                    return null == a || "boolean" == typeof a ? c.apply(this, arguments) : this.animate(J(b, !0), a, d, e)
                }
            }), fa.each({
                slideDown: J("show"),
                slideUp: J("hide"),
                slideToggle: J("toggle"),
                fadeIn: {
                    opacity: "show"
                },
                fadeOut: {
                    opacity: "hide"
                },
                fadeToggle: {
                    opacity: "toggle"
                }
            }, function(a, b) {
                fa.fn[a] = function(a, c, d) {
                    return this.animate(b, a, c, d)
                }
            }), fa.timers = [], fa.fx.tick = function() {
                var a, b = 0,
                    c = fa.timers;
                for (eb = fa.now(); b < c.length; b++) a = c[b], a() || c[b] !== a || c.splice(b--, 1);
                c.length || fa.fx.stop(), eb = void 0
            }, fa.fx.timer = function(a) {
                fa.timers.push(a), a() ? fa.fx.start() : fa.timers.pop()
            }, fa.fx.interval = 13, fa.fx.start = function() {
                fb || (fb = a.setInterval(fa.fx.tick, fa.fx.interval))
            }, fa.fx.stop = function() {
                a.clearInterval(fb), fb = null
            }, fa.fx.speeds = {
                slow: 600,
                fast: 200,
                _default: 400
            }, fa.fn.delay = function(b, c) {
                return b = fa.fx ? fa.fx.speeds[b] || b : b, c = c || "fx", this.queue(c, function(c, d) {
                    var e = a.setTimeout(c, b);
                    d.stop = function() {
                        a.clearTimeout(e)
                    }
                })
            },
            function() {
                var a = X.createElement("input"),
                    b = X.createElement("select"),
                    c = b.appendChild(X.createElement("option"));
                a.type = "checkbox", da.checkOn = "" !== a.value, da.optSelected = c.selected, b.disabled = !0, da.optDisabled = !c.disabled, a = X.createElement("input"), a.value = "t", a.type = "radio", da.radioValue = "t" === a.value
            }();
        var ib, jb = fa.expr.attrHandle;
        fa.fn.extend({
            attr: function(a, b) {
                return xa(this, fa.attr, a, b, arguments.length > 1)
            },
            removeAttr: function(a) {
                return this.each(function() {
                    fa.removeAttr(this, a)
                })
            }
        }), fa.extend({
            attr: function(a, b, c) {
                var d, e, f = a.nodeType;
                return 3 !== f && 8 !== f && 2 !== f ? "undefined" == typeof a.getAttribute ? fa.prop(a, b, c) : (1 === f && fa.isXMLDoc(a) || (b = b.toLowerCase(), e = fa.attrHooks[b] || (fa.expr.match.bool.test(b) ? ib : void 0)), void 0 !== c ? null === c ? void fa.removeAttr(a, b) : e && "set" in e && void 0 !== (d = e.set(a, c, b)) ? d : (a.setAttribute(b, c + ""), c) : e && "get" in e && null !== (d = e.get(a, b)) ? d : (d = fa.find.attr(a, b), null == d ? void 0 : d)) : void 0
            },
            attrHooks: {
                type: {
                    set: function(a, b) {
                        if (!da.radioValue && "radio" === b && fa.nodeName(a, "input")) {
                            var c = a.value;
                            return a.setAttribute("type", b), c && (a.value = c), b
                        }
                    }
                }
            },
            removeAttr: function(a, b) {
                var c, d, e = 0,
                    f = b && b.match(va);
                if (f && 1 === a.nodeType)
                    for (; c = f[e++];) d = fa.propFix[c] || c, fa.expr.match.bool.test(c) && (a[d] = !1), a.removeAttribute(c)
            }
        }), ib = {
            set: function(a, b, c) {
                return b === !1 ? fa.removeAttr(a, c) : a.setAttribute(c, c), c
            }
        }, fa.each(fa.expr.match.bool.source.match(/\w+/g), function(a, b) {
            var c = jb[b] || fa.find.attr;
            jb[b] = function(a, b, d) {
                var e, f;
                return d || (f = jb[b], jb[b] = e, e = null != c(a, b, d) ? b.toLowerCase() : null, jb[b] = f), e
            }
        });
        var kb = /^(?:input|select|textarea|button)$/i,
            lb = /^(?:a|area)$/i;
        fa.fn.extend({
            prop: function(a, b) {
                return xa(this, fa.prop, a, b, arguments.length > 1)
            },
            removeProp: function(a) {
                return this.each(function() {
                    delete this[fa.propFix[a] || a]
                })
            }
        }), fa.extend({
            prop: function(a, b, c) {
                var d, e, f = a.nodeType;
                return 3 !== f && 8 !== f && 2 !== f ? (1 === f && fa.isXMLDoc(a) || (b = fa.propFix[b] || b, e = fa.propHooks[b]), void 0 !== c ? e && "set" in e && void 0 !== (d = e.set(a, c, b)) ? d : a[b] = c : e && "get" in e && null !== (d = e.get(a, b)) ? d : a[b]) : void 0
            },
            propHooks: {
                tabIndex: {
                    get: function(a) {
                        var b = fa.find.attr(a, "tabindex");
                        return b ? parseInt(b, 10) : kb.test(a.nodeName) || lb.test(a.nodeName) && a.href ? 0 : -1
                    }
                }
            },
            propFix: {
                "for": "htmlFor",
                "class": "className"
            }
        }), da.optSelected || (fa.propHooks.selected = {
            get: function(a) {
                var b = a.parentNode;
                return b && b.parentNode && b.parentNode.selectedIndex, null
            }
        }), fa.each(["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function() {
            fa.propFix[this.toLowerCase()] = this
        });
        var mb = /[\t\r\n\f]/g;
        fa.fn.extend({
            addClass: function(a) {
                var b, c, d, e, f, g, h, i = 0;
                if (fa.isFunction(a)) return this.each(function(b) {
                    fa(this).addClass(a.call(this, b, O(this)))
                });
                if ("string" == typeof a && a)
                    for (b = a.match(va) || []; c = this[i++];)
                        if (e = O(c), d = 1 === c.nodeType && (" " + e + " ").replace(mb, " ")) {
                            for (g = 0; f = b[g++];) d.indexOf(" " + f + " ") < 0 && (d += f + " ");
                            h = fa.trim(d), e !== h && c.setAttribute("class", h)
                        }
                return this
            },
            removeClass: function(a) {
                var b, c, d, e, f, g, h, i = 0;
                if (fa.isFunction(a)) return this.each(function(b) {
                    fa(this).removeClass(a.call(this, b, O(this)))
                });
                if (!arguments.length) return this.attr("class", "");
                if ("string" == typeof a && a)
                    for (b = a.match(va) || []; c = this[i++];)
                        if (e = O(c), d = 1 === c.nodeType && (" " + e + " ").replace(mb, " ")) {
                            for (g = 0; f = b[g++];)
                                for (; d.indexOf(" " + f + " ") > -1;) d = d.replace(" " + f + " ", " ");
                            h = fa.trim(d), e !== h && c.setAttribute("class", h)
                        }
                return this
            },
            toggleClass: function(a, b) {
                var c = typeof a;
                return "boolean" == typeof b && "string" === c ? b ? this.addClass(a) : this.removeClass(a) : fa.isFunction(a) ? this.each(function(c) {
                    fa(this).toggleClass(a.call(this, c, O(this), b), b)
                }) : this.each(function() {
                    var b, d, e, f;
                    if ("string" === c)
                        for (d = 0, e = fa(this), f = a.match(va) || []; b = f[d++];) e.hasClass(b) ? e.removeClass(b) : e.addClass(b);
                    else(void 0 === a || "boolean" === c) && (b = O(this), b && za.set(this, "__className__", b), this.setAttribute && this.setAttribute("class", b || a === !1 ? "" : za.get(this, "__className__") || ""))
                })
            },
            hasClass: function(a) {
                var b, c, d = 0;
                for (b = " " + a + " "; c = this[d++];)
                    if (1 === c.nodeType && (" " + O(c) + " ").replace(mb, " ").indexOf(b) > -1) return !0;
                return !1
            }
        });
        var nb = /\r/g;
        fa.fn.extend({
            val: function(a) {
                var b, c, d, e = this[0];
                return arguments.length ? (d = fa.isFunction(a), this.each(function(c) {
                    var e;
                    1 === this.nodeType && (e = d ? a.call(this, c, fa(this).val()) : a, null == e ? e = "" : "number" == typeof e ? e += "" : fa.isArray(e) && (e = fa.map(e, function(a) {
                        return null == a ? "" : a + ""
                    })), b = fa.valHooks[this.type] || fa.valHooks[this.nodeName.toLowerCase()], b && "set" in b && void 0 !== b.set(this, e, "value") || (this.value = e))
                })) : e ? (b = fa.valHooks[e.type] || fa.valHooks[e.nodeName.toLowerCase()], b && "get" in b && void 0 !== (c = b.get(e, "value")) ? c : (c = e.value, "string" == typeof c ? c.replace(nb, "") : null == c ? "" : c)) : void 0
            }
        }), fa.extend({
            valHooks: {
                option: {
                    get: function(a) {
                        return fa.trim(a.value)
                    }
                },
                select: {
                    get: function(a) {
                        for (var b, c, d = a.options, e = a.selectedIndex, f = "select-one" === a.type || 0 > e, g = f ? null : [], h = f ? e + 1 : d.length, i = 0 > e ? h : f ? e : 0; h > i; i++)
                            if (c = d[i], (c.selected || i === e) && (da.optDisabled ? !c.disabled : null === c.getAttribute("disabled")) && (!c.parentNode.disabled || !fa.nodeName(c.parentNode, "optgroup"))) {
                                if (b = fa(c).val(), f) return b;
                                g.push(b)
                            }
                        return g
                    },
                    set: function(a, b) {
                        for (var c, d, e = a.options, f = fa.makeArray(b), g = e.length; g--;) d = e[g], (d.selected = fa.inArray(fa.valHooks.option.get(d), f) > -1) && (c = !0);
                        return c || (a.selectedIndex = -1), f
                    }
                }
            }
        }), fa.each(["radio", "checkbox"], function() {
            fa.valHooks[this] = {
                set: function(a, b) {
                    return fa.isArray(b) ? a.checked = fa.inArray(fa(a).val(), b) > -1 : void 0
                }
            }, da.checkOn || (fa.valHooks[this].get = function(a) {
                return null === a.getAttribute("value") ? "on" : a.value
            })
        });
        var ob = /^(?:focusinfocus|focusoutblur)$/;
        fa.extend(fa.event, {
            trigger: function(b, c, d, e) {
                var f, g, h, i, j, k, l, m = [d || X],
                    n = ca.call(b, "type") ? b.type : b,
                    o = ca.call(b, "namespace") ? b.namespace.split(".") : [];
                if (g = h = d = d || X, 3 !== d.nodeType && 8 !== d.nodeType && !ob.test(n + fa.event.triggered) && (n.indexOf(".") > -1 && (o = n.split("."), n = o.shift(), o.sort()), j = n.indexOf(":") < 0 && "on" + n, b = b[fa.expando] ? b : new fa.Event(n, "object" == typeof b && b), b.isTrigger = e ? 2 : 3, b.namespace = o.join("."), b.rnamespace = b.namespace ? new RegExp("(^|\\.)" + o.join("\\.(?:.*\\.|)") + "(\\.|$)") : null, b.result = void 0, b.target || (b.target = d), c = null == c ? [b] : fa.makeArray(c, [b]), l = fa.event.special[n] || {}, e || !l.trigger || l.trigger.apply(d, c) !== !1)) {
                    if (!e && !l.noBubble && !fa.isWindow(d)) {
                        for (i = l.delegateType || n, ob.test(i + n) || (g = g.parentNode); g; g = g.parentNode) m.push(g), h = g;
                        h === (d.ownerDocument || X) && m.push(h.defaultView || h.parentWindow || a)
                    }
                    for (f = 0;
                        (g = m[f++]) && !b.isPropagationStopped();) b.type = f > 1 ? i : l.bindType || n, k = (za.get(g, "events") || {})[b.type] && za.get(g, "handle"), k && k.apply(g, c), k = j && g[j], k && k.apply && ya(g) && (b.result = k.apply(g, c), b.result === !1 && b.preventDefault());
                    return b.type = n, e || b.isDefaultPrevented() || l._default && l._default.apply(m.pop(), c) !== !1 || !ya(d) || j && fa.isFunction(d[n]) && !fa.isWindow(d) && (h = d[j], h && (d[j] = null), fa.event.triggered = n, d[n](), fa.event.triggered = void 0, h && (d[j] = h)), b.result
                }
            },
            simulate: function(a, b, c) {
                var d = fa.extend(new fa.Event, c, {
                    type: a,
                    isSimulated: !0
                });
                fa.event.trigger(d, null, b), d.isDefaultPrevented() && c.preventDefault()
            }
        }), fa.fn.extend({
            trigger: function(a, b) {
                return this.each(function() {
                    fa.event.trigger(a, b, this)
                })
            },
            triggerHandler: function(a, b) {
                var c = this[0];
                return c ? fa.event.trigger(a, b, c, !0) : void 0
            }
        }), fa.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "), function(a, b) {
            fa.fn[b] = function(a, c) {
                return arguments.length > 0 ? this.on(b, null, a, c) : this.trigger(b)
            }
        }), fa.fn.extend({
            hover: function(a, b) {
                return this.mouseenter(a).mouseleave(b || a)
            }
        }), da.focusin = "onfocusin" in a, da.focusin || fa.each({
            focus: "focusin",
            blur: "focusout"
        }, function(a, b) {
            var c = function(a) {
                fa.event.simulate(b, a.target, fa.event.fix(a))
            };
            fa.event.special[b] = {
                setup: function() {
                    var d = this.ownerDocument || this,
                        e = za.access(d, b);
                    e || d.addEventListener(a, c, !0), za.access(d, b, (e || 0) + 1)
                },
                teardown: function() {
                    var d = this.ownerDocument || this,
                        e = za.access(d, b) - 1;
                    e ? za.access(d, b, e) : (d.removeEventListener(a, c, !0), za.remove(d, b))
                }
            }
        });
        var pb = a.location,
            qb = fa.now(),
            rb = /\?/;
        fa.parseJSON = function(a) {
            return JSON.parse(a + "")
        }, fa.parseXML = function(b) {
            var c;
            if (!b || "string" != typeof b) return null;
            try {
                c = (new a.DOMParser).parseFromString(b, "text/xml")
            } catch (d) {
                c = void 0
            }
            return (!c || c.getElementsByTagName("parsererror").length) && fa.error("Invalid XML: " + b), c
        };
        var sb = /#.*$/,
            tb = /([?&])_=[^&]*/,
            ub = /^(.*?):[ \t]*([^\r\n]*)$/gm,
            vb = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
            wb = /^(?:GET|HEAD)$/,
            xb = /^\/\//,
            yb = {},
            zb = {},
            Ab = "*/".concat("*"),
            Bb = X.createElement("a");
        Bb.href = pb.href, fa.extend({
            active: 0,
            lastModified: {},
            etag: {},
            ajaxSettings: {
                url: pb.href,
                type: "GET",
                isLocal: vb.test(pb.protocol),
                global: !0,
                processData: !0,
                async: !0,
                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                accepts: {
                    "*": Ab,
                    text: "text/plain",
                    html: "text/html",
                    xml: "application/xml, text/xml",
                    json: "application/json, text/javascript"
                },
                contents: {
                    xml: /\bxml\b/,
                    html: /\bhtml/,
                    json: /\bjson\b/
                },
                responseFields: {
                    xml: "responseXML",
                    text: "responseText",
                    json: "responseJSON"
                },
                converters: {
                    "* text": String,
                    "text html": !0,
                    "text json": fa.parseJSON,
                    "text xml": fa.parseXML
                },
                flatOptions: {
                    url: !0,
                    context: !0
                }
            },
            ajaxSetup: function(a, b) {
                return b ? R(R(a, fa.ajaxSettings), b) : R(fa.ajaxSettings, a)
            },
            ajaxPrefilter: P(yb),
            ajaxTransport: P(zb),
            ajax: function(b, c) {
                function d(b, c, d, h) {
                    var j, l, s, t, v, x = c;
                    2 !== u && (u = 2, i && a.clearTimeout(i), e = void 0, g = h || "", w.readyState = b > 0 ? 4 : 0, j = b >= 200 && 300 > b || 304 === b, d && (t = S(m, w, d)), t = T(m, t, w, j), j ? (m.ifModified && (v = w.getResponseHeader("Last-Modified"), v && (fa.lastModified[f] = v), v = w.getResponseHeader("etag"), v && (fa.etag[f] = v)), 204 === b || "HEAD" === m.type ? x = "nocontent" : 304 === b ? x = "notmodified" : (x = t.state, l = t.data, s = t.error, j = !s)) : (s = x, (b || !x) && (x = "error", 0 > b && (b = 0))), w.status = b, w.statusText = (c || x) + "", j ? p.resolveWith(n, [l, x, w]) : p.rejectWith(n, [w, x, s]), w.statusCode(r), r = void 0, k && o.trigger(j ? "ajaxSuccess" : "ajaxError", [w, m, j ? l : s]), q.fireWith(n, [w, x]), k && (o.trigger("ajaxComplete", [w, m]), --fa.active || fa.event.trigger("ajaxStop")))
                }
                "object" == typeof b && (c = b, b = void 0), c = c || {};
                var e, f, g, h, i, j, k, l, m = fa.ajaxSetup({}, c),
                    n = m.context || m,
                    o = m.context && (n.nodeType || n.jquery) ? fa(n) : fa.event,
                    p = fa.Deferred(),
                    q = fa.Callbacks("once memory"),
                    r = m.statusCode || {},
                    s = {},
                    t = {},
                    u = 0,
                    v = "canceled",
                    w = {
                        readyState: 0,
                        getResponseHeader: function(a) {
                            var b;
                            if (2 === u) {
                                if (!h)
                                    for (h = {}; b = ub.exec(g);) h[b[1].toLowerCase()] = b[2];
                                b = h[a.toLowerCase()]
                            }
                            return null == b ? null : b
                        },
                        getAllResponseHeaders: function() {
                            return 2 === u ? g : null
                        },
                        setRequestHeader: function(a, b) {
                            var c = a.toLowerCase();
                            return u || (a = t[c] = t[c] || a, s[a] = b), this
                        },
                        overrideMimeType: function(a) {
                            return u || (m.mimeType = a), this
                        },
                        statusCode: function(a) {
                            var b;
                            if (a)
                                if (2 > u)
                                    for (b in a) r[b] = [r[b], a[b]];
                                else w.always(a[w.status]);
                            return this
                        },
                        abort: function(a) {
                            var b = a || v;
                            return e && e.abort(b), d(0, b), this
                        }
                    };
                if (p.promise(w).complete = q.add, w.success = w.done, w.error = w.fail, m.url = ((b || m.url || pb.href) + "").replace(sb, "").replace(xb, pb.protocol + "//"), m.type = c.method || c.type || m.method || m.type, m.dataTypes = fa.trim(m.dataType || "*").toLowerCase().match(va) || [""], null == m.crossDomain) {
                    j = X.createElement("a");
                    try {
                        j.href = m.url, j.href = j.href, m.crossDomain = Bb.protocol + "//" + Bb.host != j.protocol + "//" + j.host
                    } catch (x) {
                        m.crossDomain = !0
                    }
                }
                if (m.data && m.processData && "string" != typeof m.data && (m.data = fa.param(m.data, m.traditional)), Q(yb, m, c, w), 2 === u) return w;
                k = fa.event && m.global, k && 0 === fa.active++ && fa.event.trigger("ajaxStart"), m.type = m.type.toUpperCase(), m.hasContent = !wb.test(m.type), f = m.url, m.hasContent || (m.data && (f = m.url += (rb.test(f) ? "&" : "?") + m.data, delete m.data), m.cache === !1 && (m.url = tb.test(f) ? f.replace(tb, "$1_=" + qb++) : f + (rb.test(f) ? "&" : "?") + "_=" + qb++)), m.ifModified && (fa.lastModified[f] && w.setRequestHeader("If-Modified-Since", fa.lastModified[f]), fa.etag[f] && w.setRequestHeader("If-None-Match", fa.etag[f])), (m.data && m.hasContent && m.contentType !== !1 || c.contentType) && w.setRequestHeader("Content-Type", m.contentType), w.setRequestHeader("Accept", m.dataTypes[0] && m.accepts[m.dataTypes[0]] ? m.accepts[m.dataTypes[0]] + ("*" !== m.dataTypes[0] ? ", " + Ab + "; q=0.01" : "") : m.accepts["*"]);
                for (l in m.headers) w.setRequestHeader(l, m.headers[l]);
                if (m.beforeSend && (m.beforeSend.call(n, w, m) === !1 || 2 === u)) return w.abort();
                v = "abort";
                for (l in {
                        success: 1,
                        error: 1,
                        complete: 1
                    }) w[l](m[l]);
                if (e = Q(zb, m, c, w)) {
                    if (w.readyState = 1, k && o.trigger("ajaxSend", [w, m]), 2 === u) return w;
                    m.async && m.timeout > 0 && (i = a.setTimeout(function() {
                        w.abort("timeout")
                    }, m.timeout));
                    try {
                        u = 1, e.send(s, d)
                    } catch (x) {
                        if (!(2 > u)) throw x;
                        d(-1, x)
                    }
                } else d(-1, "No Transport");
                return w
            },
            getJSON: function(a, b, c) {
                return fa.get(a, b, c, "json")
            },
            getScript: function(a, b) {
                return fa.get(a, void 0, b, "script")
            }
        }), fa.each(["get", "post"], function(a, b) {
            fa[b] = function(a, c, d, e) {
                return fa.isFunction(c) && (e = e || d, d = c, c = void 0), fa.ajax(fa.extend({
                    url: a,
                    type: b,
                    dataType: e,
                    data: c,
                    success: d
                }, fa.isPlainObject(a) && a))
            }
        }), fa._evalUrl = function(a) {
            return fa.ajax({
                url: a,
                type: "GET",
                dataType: "script",
                async: !1,
                global: !1,
                "throws": !0
            })
        }, fa.fn.extend({
            wrapAll: function(a) {
                var b;
                return fa.isFunction(a) ? this.each(function(b) {
                    fa(this).wrapAll(a.call(this, b))
                }) : (this[0] && (b = fa(a, this[0].ownerDocument).eq(0).clone(!0), this[0].parentNode && b.insertBefore(this[0]), b.map(function() {
                    for (var a = this; a.firstElementChild;) a = a.firstElementChild;
                    return a
                }).append(this)), this)
            },
            wrapInner: function(a) {
                return fa.isFunction(a) ? this.each(function(b) {
                    fa(this).wrapInner(a.call(this, b))
                }) : this.each(function() {
                    var b = fa(this),
                        c = b.contents();
                    c.length ? c.wrapAll(a) : b.append(a)
                })
            },
            wrap: function(a) {
                var b = fa.isFunction(a);
                return this.each(function(c) {
                    fa(this).wrapAll(b ? a.call(this, c) : a)
                })
            },
            unwrap: function() {
                return this.parent().each(function() {
                    fa.nodeName(this, "body") || fa(this).replaceWith(this.childNodes)
                }).end()
            }
        }), fa.expr.filters.hidden = function(a) {
            return !fa.expr.filters.visible(a)
        }, fa.expr.filters.visible = function(a) {
            return a.offsetWidth > 0 || a.offsetHeight > 0 || a.getClientRects().length > 0
        };
        var Cb = /%20/g,
            Db = /\[\]$/,
            Eb = /\r?\n/g,
            Fb = /^(?:submit|button|image|reset|file)$/i,
            Gb = /^(?:input|select|textarea|keygen)/i;
        fa.param = function(a, b) {
            var c, d = [],
                e = function(a, b) {
                    b = fa.isFunction(b) ? b() : null == b ? "" : b, d[d.length] = encodeURIComponent(a) + "=" + encodeURIComponent(b)
                };
            if (void 0 === b && (b = fa.ajaxSettings && fa.ajaxSettings.traditional), fa.isArray(a) || a.jquery && !fa.isPlainObject(a)) fa.each(a, function() {
                e(this.name, this.value)
            });
            else
                for (c in a) U(c, a[c], b, e);
            return d.join("&").replace(Cb, "+")
        }, fa.fn.extend({
            serialize: function() {
                return fa.param(this.serializeArray())
            },
            serializeArray: function() {
                return this.map(function() {
                    var a = fa.prop(this, "elements");
                    return a ? fa.makeArray(a) : this
                }).filter(function() {
                    var a = this.type;
                    return this.name && !fa(this).is(":disabled") && Gb.test(this.nodeName) && !Fb.test(a) && (this.checked || !Ha.test(a))
                }).map(function(a, b) {
                    var c = fa(this).val();
                    return null == c ? null : fa.isArray(c) ? fa.map(c, function(a) {
                        return {
                            name: b.name,
                            value: a.replace(Eb, "\r\n")
                        }
                    }) : {
                        name: b.name,
                        value: c.replace(Eb, "\r\n")
                    }
                }).get()
            }
        }), fa.ajaxSettings.xhr = function() {
            try {
                return new a.XMLHttpRequest
            } catch (b) {}
        };
        var Hb = {
                0: 200,
                1223: 204
            },
            Ib = fa.ajaxSettings.xhr();
        da.cors = !!Ib && "withCredentials" in Ib, da.ajax = Ib = !!Ib, fa.ajaxTransport(function(b) {
            var c, d;
            return da.cors || Ib && !b.crossDomain ? {
                send: function(e, f) {
                    var g, h = b.xhr();
                    if (h.open(b.type, b.url, b.async, b.username, b.password), b.xhrFields)
                        for (g in b.xhrFields) h[g] = b.xhrFields[g];
                    b.mimeType && h.overrideMimeType && h.overrideMimeType(b.mimeType), b.crossDomain || e["X-Requested-With"] || (e["X-Requested-With"] = "XMLHttpRequest");
                    for (g in e) h.setRequestHeader(g, e[g]);
                    c = function(a) {
                        return function() {
                            c && (c = d = h.onload = h.onerror = h.onabort = h.onreadystatechange = null, "abort" === a ? h.abort() : "error" === a ? "number" != typeof h.status ? f(0, "error") : f(h.status, h.statusText) : f(Hb[h.status] || h.status, h.statusText, "text" !== (h.responseType || "text") || "string" != typeof h.responseText ? {
                                binary: h.response
                            } : {
                                text: h.responseText
                            }, h.getAllResponseHeaders()))
                        }
                    }, h.onload = c(), d = h.onerror = c("error"), void 0 !== h.onabort ? h.onabort = d : h.onreadystatechange = function() {
                        4 === h.readyState && a.setTimeout(function() {
                            c && d()
                        })
                    }, c = c("abort");
                    try {
                        h.send(b.hasContent && b.data || null)
                    } catch (i) {
                        if (c) throw i
                    }
                },
                abort: function() {
                    c && c()
                }
            } : void 0
        }), fa.ajaxSetup({
            accepts: {
                script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
            },
            contents: {
                script: /\b(?:java|ecma)script\b/
            },
            converters: {
                "text script": function(a) {
                    return fa.globalEval(a), a
                }
            }
        }), fa.ajaxPrefilter("script", function(a) {
            void 0 === a.cache && (a.cache = !1), a.crossDomain && (a.type = "GET")
        }), fa.ajaxTransport("script", function(a) {
            if (a.crossDomain) {
                var b, c;
                return {
                    send: function(d, e) {
                        b = fa("<script>").prop({
                            charset: a.scriptCharset,
                            src: a.url
                        }).on("load error", c = function(a) {
                            b.remove(), c = null, a && e("error" === a.type ? 404 : 200, a.type)
                        }), X.head.appendChild(b[0])
                    },
                    abort: function() {
                        c && c()
                    }
                }
            }
        });
        var Jb = [],
            Kb = /(=)\?(?=&|$)|\?\?/;
        fa.ajaxSetup({
            jsonp: "callback",
            jsonpCallback: function() {
                var a = Jb.pop() || fa.expando + "_" + qb++;
                return this[a] = !0, a
            }
        }), fa.ajaxPrefilter("json jsonp", function(b, c, d) {
            var e, f, g, h = b.jsonp !== !1 && (Kb.test(b.url) ? "url" : "string" == typeof b.data && 0 === (b.contentType || "").indexOf("application/x-www-form-urlencoded") && Kb.test(b.data) && "data");
            return h || "jsonp" === b.dataTypes[0] ? (e = b.jsonpCallback = fa.isFunction(b.jsonpCallback) ? b.jsonpCallback() : b.jsonpCallback, h ? b[h] = b[h].replace(Kb, "$1" + e) : b.jsonp !== !1 && (b.url += (rb.test(b.url) ? "&" : "?") + b.jsonp + "=" + e), b.converters["script json"] = function() {
                return g || fa.error(e + " was not called"), g[0]
            }, b.dataTypes[0] = "json", f = a[e], a[e] = function() {
                g = arguments
            }, d.always(function() {
                void 0 === f ? fa(a).removeProp(e) : a[e] = f, b[e] && (b.jsonpCallback = c.jsonpCallback, Jb.push(e)), g && fa.isFunction(f) && f(g[0]), g = f = void 0
            }), "script") : void 0
        }), da.createHTMLDocument = function() {
            var a = X.implementation.createHTMLDocument("").body;
            return a.innerHTML = "<form></form><form></form>", 2 === a.childNodes.length
        }(), fa.parseHTML = function(a, b, c) {
            if (!a || "string" != typeof a) return null;
            "boolean" == typeof b && (c = b, b = !1), b = b || (da.createHTMLDocument ? X.implementation.createHTMLDocument("") : X);
            var d = oa.exec(a),
                e = !c && [];
            return d ? [b.createElement(d[1])] : (d = m([a], b, e), e && e.length && fa(e).remove(), fa.merge([], d.childNodes))
        };
        var Lb = fa.fn.load;
        fa.fn.load = function(a, b, c) {
            if ("string" != typeof a && Lb) return Lb.apply(this, arguments);
            var d, e, f, g = this,
                h = a.indexOf(" ");
            return h > -1 && (d = fa.trim(a.slice(h)), a = a.slice(0, h)), fa.isFunction(b) ? (c = b, b = void 0) : b && "object" == typeof b && (e = "POST"), g.length > 0 && fa.ajax({
                url: a,
                type: e || "GET",
                dataType: "html",
                data: b
            }).done(function(a) {
                f = arguments, g.html(d ? fa("<div>").append(fa.parseHTML(a)).find(d) : a)
            }).always(c && function(a, b) {
                g.each(function() {
                    c.apply(g, f || [a.responseText, b, a])
                })
            }), this
        }, fa.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function(a, b) {
            fa.fn[b] = function(a) {
                return this.on(b, a)
            }
        }), fa.expr.filters.animated = function(a) {
            return fa.grep(fa.timers, function(b) {
                return a === b.elem
            }).length
        }, fa.offset = {
            setOffset: function(a, b, c) {
                var d, e, f, g, h, i, j, k = fa.css(a, "position"),
                    l = fa(a),
                    m = {};
                "static" === k && (a.style.position = "relative"), h = l.offset(), f = fa.css(a, "top"), i = fa.css(a, "left"), j = ("absolute" === k || "fixed" === k) && (f + i).indexOf("auto") > -1, j ? (d = l.position(), g = d.top, e = d.left) : (g = parseFloat(f) || 0, e = parseFloat(i) || 0), fa.isFunction(b) && (b = b.call(a, c, fa.extend({}, h))), null != b.top && (m.top = b.top - h.top + g), null != b.left && (m.left = b.left - h.left + e), "using" in b ? b.using.call(a, m) : l.css(m)
            }
        }, fa.fn.extend({
            offset: function(a) {
                if (arguments.length) return void 0 === a ? this : this.each(function(b) {
                    fa.offset.setOffset(this, a, b)
                });
                var b, c, d = this[0],
                    e = {
                        top: 0,
                        left: 0
                    },
                    f = d && d.ownerDocument;
                return f ? (b = f.documentElement, fa.contains(b, d) ? (e = d.getBoundingClientRect(), c = V(f), {
                    top: e.top + c.pageYOffset - b.clientTop,
                    left: e.left + c.pageXOffset - b.clientLeft
                }) : e) : void 0
            },
            position: function() {
                if (this[0]) {
                    var a, b, c = this[0],
                        d = {
                            top: 0,
                            left: 0
                        };
                    return "fixed" === fa.css(c, "position") ? b = c.getBoundingClientRect() : (a = this.offsetParent(), b = this.offset(), fa.nodeName(a[0], "html") || (d = a.offset()), d.top += fa.css(a[0], "borderTopWidth", !0) - a.scrollTop(), d.left += fa.css(a[0], "borderLeftWidth", !0) - a.scrollLeft()), {
                        top: b.top - d.top - fa.css(c, "marginTop", !0),
                        left: b.left - d.left - fa.css(c, "marginLeft", !0)
                    }
                }
            },
            offsetParent: function() {
                return this.map(function() {
                    for (var a = this.offsetParent; a && "static" === fa.css(a, "position");) a = a.offsetParent;
                    return a || $a
                })
            }
        }), fa.each({
            scrollLeft: "pageXOffset",
            scrollTop: "pageYOffset"
        }, function(a, b) {
            var c = "pageYOffset" === b;
            fa.fn[a] = function(d) {
                return xa(this, function(a, d, e) {
                    var f = V(a);
                    return void 0 === e ? f ? f[b] : a[d] : void(f ? f.scrollTo(c ? f.pageXOffset : e, c ? e : f.pageYOffset) : a[d] = e)
                }, a, d, arguments.length)
            }
        }), fa.each(["top", "left"], function(a, b) {
            fa.cssHooks[b] = B(da.pixelPosition, function(a, c) {
                return c ? (c = A(a, b), Xa.test(c) ? fa(a).position()[b] + "px" : c) : void 0
            })
        }), fa.each({
            Height: "height",
            Width: "width"
        }, function(a, b) {
            fa.each({
                padding: "inner" + a,
                content: b,
                "": "outer" + a
            }, function(c, d) {
                fa.fn[d] = function(d, e) {
                    var f = arguments.length && (c || "boolean" != typeof d),
                        g = c || (d === !0 || e === !0 ? "margin" : "border");
                    return xa(this, function(b, c, d) {
                        var e;
                        return fa.isWindow(b) ? b.document.documentElement["client" + a] : 9 === b.nodeType ? (e = b.documentElement, Math.max(b.body["scroll" + a], e["scroll" + a], b.body["offset" + a], e["offset" + a], e["client" + a])) : void 0 === d ? fa.css(b, c, g) : fa.style(b, c, d, g)
                    }, b, f ? d : void 0, f, null)
                }
            })
        }), fa.fn.extend({
            bind: function(a, b, c) {
                return this.on(a, null, b, c)
            },
            unbind: function(a, b) {
                return this.off(a, null, b)
            },
            delegate: function(a, b, c, d) {
                return this.on(b, a, c, d)
            },
            undelegate: function(a, b, c) {
                return 1 === arguments.length ? this.off(a, "**") : this.off(b, a || "**", c)
            },
            size: function() {
                return this.length
            }
        }), fa.fn.andSelf = fa.fn.addBack, "function" == typeof define && define.amd && define("jquery", [], function() {
            return fa
        });
        var Mb = a.jQuery,
            Nb = a.$;
        return fa.noConflict = function(b) {
            return a.$ === fa && (a.$ = Nb), b && a.jQuery === fa && (a.jQuery = Mb), fa
        }, b || (a.jQuery = a.$ = fa), fa
    }),
    function(a, b, c) {
        "function" == typeof define && define.amd ? define(["jquery"], function(d) {
            return c(d, a, b), d.mobile
        }) : c(a.jQuery, a, b)
    }(this, document, function(a, b, c, d) {
        ! function(a, b, c, d) {
            function e(a) {
                for (; a && "undefined" != typeof a.originalEvent;) a = a.originalEvent;
                return a
            }

            function f(b, c) {
                var f, g, h, i, j, k, l, m, n, o = b.type;
                if (b = a.Event(b), b.type = c, f = b.originalEvent, g = a.event.props, o.search(/^(mouse|click)/) > -1 && (g = E), f)
                    for (l = g.length, i; l;) i = g[--l], b[i] = f[i];
                if (o.search(/mouse(down|up)|click/) > -1 && !b.which && (b.which = 1), -1 !== o.search(/^touch/) && (h = e(f), o = h.touches, j = h.changedTouches, k = o && o.length ? o[0] : j && j.length ? j[0] : d, k))
                    for (m = 0, n = C.length; n > m; m++) i = C[m], b[i] = k[i];
                return b
            }

            function g(b) {
                for (var c, d, e = {}; b;) {
                    c = a.data(b, z);
                    for (d in c) c[d] && (e[d] = e.hasVirtualBinding = !0);
                    b = b.parentNode
                }
                return e
            }

            function h(b, c) {
                for (var d; b;) {
                    if (d = a.data(b, z), d && (!c || d[c])) return b;
                    b = b.parentNode
                }
                return null
            }

            function i() {
                M = !1
            }

            function j() {
                M = !0
            }

            function k() {
                Q = 0, K.length = 0, L = !1, j()
            }

            function l() {
                i()
            }

            function m() {
                n(), G = setTimeout(function() {
                    G = 0, k()
                }, a.vmouse.resetTimerDuration)
            }

            function n() {
                G && (clearTimeout(G), G = 0)
            }

            function o(b, c, d) {
                var e;
                return (d && d[b] || !d && h(c.target, b)) && (e = f(c, b), a(c.target).trigger(e)), e
            }

            function p(b) {
                var c, d = a.data(b.target, A);
                !L && (!Q || Q !== d) && (c = o("v" + b.type, b), c && (c.isDefaultPrevented() && b.preventDefault(), c.isPropagationStopped() && b.stopPropagation(), c.isImmediatePropagationStopped() && b.stopImmediatePropagation()))
            }

            function q(b) {
                var c, d, f, h = e(b).touches;
                h && 1 === h.length && (c = b.target, d = g(c), d.hasVirtualBinding && (Q = P++, a.data(c, A, Q), n(), l(), J = !1, f = e(b).touches[0], H = f.pageX, I = f.pageY, o("vmouseover", b, d), o("vmousedown", b, d)))
            }

            function r(a) {
                M || (J || o("vmousecancel", a, g(a.target)), J = !0, m())
            }

            function s(b) {
                if (!M) {
                    var c = e(b).touches[0],
                        d = J,
                        f = a.vmouse.moveDistanceThreshold,
                        h = g(b.target);
                    J = J || Math.abs(c.pageX - H) > f || Math.abs(c.pageY - I) > f, J && !d && o("vmousecancel", b, h), o("vmousemove", b, h), m()
                }
            }

            function t(a) {
                if (!M) {
                    j();
                    var b, c, d = g(a.target);
                    o("vmouseup", a, d), J || (b = o("vclick", a, d), b && b.isDefaultPrevented() && (c = e(a).changedTouches[0], K.push({
                        touchID: Q,
                        x: c.clientX,
                        y: c.clientY
                    }), L = !0)), o("vmouseout", a, d), J = !1, m()
                }
            }

            function u(b) {
                var c, d = a.data(b, z);
                if (d)
                    for (c in d)
                        if (d[c]) return !0;
                return !1
            }

            function v() {}

            function w(b) {
                var c = b.substr(1);
                return {
                    setup: function() {
                        u(this) || a.data(this, z, {});
                        var d = a.data(this, z);
                        d[b] = !0, F[b] = (F[b] || 0) + 1, 1 === F[b] && O.bind(c, p), a(this).bind(c, v), N && (F.touchstart = (F.touchstart || 0) + 1, 1 === F.touchstart && O.bind("touchstart", q).bind("touchend", t).bind("touchmove", s).bind("scroll", r))
                    },
                    teardown: function() {
                        --F[b], F[b] || O.unbind(c, p), N && (--F.touchstart, F.touchstart || O.unbind("touchstart", q).unbind("touchmove", s).unbind("touchend", t).unbind("scroll", r));
                        var d = a(this),
                            e = a.data(this, z);
                        e && (e[b] = !1), d.unbind(c, v), u(this) || d.removeData(z)
                    }
                }
            }
            var x, y, z = "virtualMouseBindings",
                A = "virtualTouchID",
                B = "vmouseover vmousedown vmousemove vmouseup vclick vmouseout vmousecancel".split(" "),
                C = "clientX clientY pageX pageY screenX screenY".split(" "),
                D = a.event.mouseHooks ? a.event.mouseHooks.props : [],
                E = a.event.props.concat(D),
                F = {},
                G = 0,
                H = 0,
                I = 0,
                J = !1,
                K = [],
                L = !1,
                M = !1,
                N = "addEventListener" in c,
                O = a(c),
                P = 1,
                Q = 0;
            for (a.vmouse = {
                    moveDistanceThreshold: 10,
                    clickDistanceThreshold: 10,
                    resetTimerDuration: 1500
                }, y = 0; y < B.length; y++) a.event.special[B[y]] = w(B[y]);
            N && c.addEventListener("click", function(b) {
                var c, d, e, f, g, h, i = K.length,
                    j = b.target;
                if (i)
                    for (c = b.clientX, d = b.clientY, x = a.vmouse.clickDistanceThreshold, e = j; e;) {
                        for (f = 0; i > f; f++)
                            if (g = K[f], h = 0, e === j && Math.abs(g.x - c) < x && Math.abs(g.y - d) < x || a.data(e, A) === g.touchID) return b.preventDefault(), void b.stopPropagation();
                        e = e.parentNode
                    }
            }, !0)
        }(a, b, c),
        function(a) {
            a.mobile = {}
        }(a),
        function(a, b) {
            var d = {
                touch: "ontouchend" in c
            };
            a.mobile.support = a.mobile.support || {}, a.extend(a.support, d), a.extend(a.mobile.support, d)
        }(a),
        function(a, b, d) {
            function e(b, c, e, f) {
                var g = e.type;
                e.type = c, f ? a.event.trigger(e, d, b) : a.event.dispatch.call(b, e), e.type = g
            }
            var f = a(c),
                g = a.mobile.support.touch,
                h = "touchmove scroll",
                i = g ? "touchstart" : "mousedown",
                j = g ? "touchend" : "mouseup",
                k = g ? "touchmove" : "mousemove";
            a.each("touchstart touchmove touchend tap taphold swipe swipeleft swiperight scrollstart scrollstop".split(" "), function(b, c) {
                a.fn[c] = function(a) {
                    return a ? this.bind(c, a) : this.trigger(c)
                }, a.attrFn && (a.attrFn[c] = !0)
            }), a.event.special.scrollstart = {
                enabled: !0,
                setup: function() {
                    function b(a, b) {
                        c = b, e(f, c ? "scrollstart" : "scrollstop", a)
                    }
                    var c, d, f = this,
                        g = a(f);
                    g.bind(h, function(e) {
                        a.event.special.scrollstart.enabled && (c || b(e, !0), clearTimeout(d), d = setTimeout(function() {
                            b(e, !1)
                        }, 50))
                    })
                },
                teardown: function() {
                    a(this).unbind(h)
                }
            }, a.event.special.tap = {
                tapholdThreshold: 750,
                emitTapOnTaphold: !0,
                setup: function() {
                    var b = this,
                        c = a(b),
                        d = !1;
                    c.bind("vmousedown", function(g) {
                        function h() {
                            clearTimeout(k)
                        }

                        function i() {
                            h(), c.unbind("vclick", j).unbind("vmouseup", h), f.unbind("vmousecancel", i)
                        }

                        function j(a) {
                            i(), d || l !== a.target ? d && a.preventDefault() : e(b, "tap", a)
                        }
                        if (d = !1, g.which && 1 !== g.which) return !1;
                        var k, l = g.target;
                        c.bind("vmouseup", h).bind("vclick", j), f.bind("vmousecancel", i), k = setTimeout(function() {
                            a.event.special.tap.emitTapOnTaphold || (d = !0), e(b, "taphold", a.Event("taphold", {
                                target: l
                            }))
                        }, a.event.special.tap.tapholdThreshold)
                    })
                },
                teardown: function() {
                    a(this).unbind("vmousedown").unbind("vclick").unbind("vmouseup"), f.unbind("vmousecancel")
                }
            }, a.event.special.swipe = {
                scrollSupressionThreshold: 30,
                durationThreshold: 1e3,
                horizontalDistanceThreshold: 30,
                verticalDistanceThreshold: 30,
                getLocation: function(a) {
                    var c = b.pageXOffset,
                        d = b.pageYOffset,
                        e = a.clientX,
                        f = a.clientY;
                    return 0 === a.pageY && Math.floor(f) > Math.floor(a.pageY) || 0 === a.pageX && Math.floor(e) > Math.floor(a.pageX) ? (e -= c, f -= d) : (f < a.pageY - d || e < a.pageX - c) && (e = a.pageX - c, f = a.pageY - d), {
                        x: e,
                        y: f
                    }
                },
                start: function(b) {
                    var c = b.originalEvent.touches ? b.originalEvent.touches[0] : b,
                        d = a.event.special.swipe.getLocation(c);
                    return {
                        time: (new Date).getTime(),
                        coords: [d.x, d.y],
                        origin: a(b.target)
                    }
                },
                stop: function(b) {
                    var c = b.originalEvent.touches ? b.originalEvent.touches[0] : b,
                        d = a.event.special.swipe.getLocation(c);
                    return {
                        time: (new Date).getTime(),
                        coords: [d.x, d.y]
                    }
                },
                handleSwipe: function(b, c, d, f) {
                    if (c.time - b.time < a.event.special.swipe.durationThreshold && Math.abs(b.coords[0] - c.coords[0]) > a.event.special.swipe.horizontalDistanceThreshold && Math.abs(b.coords[1] - c.coords[1]) < a.event.special.swipe.verticalDistanceThreshold) {
                        var g = b.coords[0] > c.coords[0] ? "swipeleft" : "swiperight";
                        return e(d, "swipe", a.Event("swipe", {
                            target: f,
                            swipestart: b,
                            swipestop: c
                        }), !0), e(d, g, a.Event(g, {
                            target: f,
                            swipestart: b,
                            swipestop: c
                        }), !0), !0
                    }
                    return !1
                },
                eventInProgress: !1,
                setup: function() {
                    var b, c = this,
                        d = a(c),
                        e = {};
                    b = a.data(this, "mobile-events"), b || (b = {
                        length: 0
                    }, a.data(this, "mobile-events", b)), b.length++, b.swipe = e, e.start = function(b) {
                        if (!a.event.special.swipe.eventInProgress) {
                            a.event.special.swipe.eventInProgress = !0;
                            var d, g = a.event.special.swipe.start(b),
                                h = b.target,
                                i = !1;
                            e.move = function(b) {
                                g && !b.isDefaultPrevented() && (d = a.event.special.swipe.stop(b), i || (i = a.event.special.swipe.handleSwipe(g, d, c, h), i && (a.event.special.swipe.eventInProgress = !1)), Math.abs(g.coords[0] - d.coords[0]) > a.event.special.swipe.scrollSupressionThreshold && b.preventDefault())
                            }, e.stop = function() {
                                i = !0, a.event.special.swipe.eventInProgress = !1, f.off(k, e.move), e.move = null
                            }, f.on(k, e.move).one(j, e.stop)
                        }
                    }, d.on(i, e.start)
                },
                teardown: function() {
                    var b, c;
                    b = a.data(this, "mobile-events"), b && (c = b.swipe, delete b.swipe, b.length--, 0 === b.length && a.removeData(this, "mobile-events")), c && (c.start && a(this).off(i, c.start), c.move && f.off(k, c.move), c.stop && f.off(j, c.stop))
                }
            }, a.each({
                scrollstop: "scrollstart",
                taphold: "tap",
                swipeleft: "swipe.left",
                swiperight: "swipe.right"
            }, function(b, c) {
                a.event.special[b] = {
                    setup: function() {
                        a(this).bind(c, a.noop)
                    },
                    teardown: function() {
                        a(this).unbind(c)
                    }
                }
            })
        }(a, this)
    }),
    function(a, b) {
        function c(b) {
            var c, d = a("<div></div>").css({
                width: "100%"
            });
            return b.append(d), c = b.width() - d.width(), d.remove(), c
        }

        function d(e, f) {
            var g = e.getBoundingClientRect(),
                h = g.top,
                i = g.bottom,
                j = g.left,
                k = g.right,
                l = a.extend({
                    tolerance: 0,
                    viewport: b
                }, f),
                m = !1,
                n = l.viewport.jquery ? l.viewport : a(l.viewport);
            n.length || (console.warn("isInViewport: The viewport selector you have provided matches no element on page."), console.warn("isInViewport: Defaulting to viewport as window"), n = a(b));
            var o = n.height(),
                p = n.width(),
                q = n[0].toString();
            if (n[0] !== b && "[object Window]" !== q && "[object DOMWindow]" !== q) {
                var r = n[0].getBoundingClientRect();
                h -= r.top, i -= r.top, j -= r.left, k -= r.left, d.scrollBarWidth = d.scrollBarWidth || c(n), p -= d.scrollBarWidth
            }
            return l.tolerance = ~~Math.round(parseFloat(l.tolerance)), l.tolerance < 0 && (l.tolerance = o + l.tolerance), 0 >= k || j >= p ? m : m = l.tolerance ? h <= l.tolerance && i >= l.tolerance : i > 0 && o >= h
        }
        String.prototype.hasOwnProperty("trim") || (String.prototype.trim = function() {
            return this.replace(/^\s*(.*?)\s*$/, "$1")
        });
        var e = function(b) {
            if (1 === arguments.length && "function" == typeof b && (b = [b]), !(b instanceof Array)) throw new SyntaxError("isInViewport: Argument(s) passed to .do/.run should be a function or an array of functions");
            for (var c = 0; c < b.length; c++)
                if ("function" == typeof b[c])
                    for (var d = 0; d < this.length; d++) b[c].call(a(this[d]));
                else console.warn("isInViewport: Argument(s) passed to .do/.run should be a function or an array of functions"), console.warn("isInViewport: Ignoring non-function values in array and moving on");
            return this
        };
        a.fn["do"] = function(a) {
            return console.warn("isInViewport: .do is deprecated as it causes issues in IE and some browsers since it's a reserved word. Use $.fn.run instead i.e., $(el).run(fn)."), e(a)
        }, a.fn.run = e;
        var f = function(b) {
            if (b) {
                var c = b.split(",");
                return 1 === c.length && isNaN(c[0]) && (c[1] = c[0], c[0] = void 0), {
                    tolerance: c[0] ? c[0].trim() : void 0,
                    viewport: c[1] ? a(c[1].trim()) : void 0
                }
            }
            return {}
        };
        a.extend(a.expr[":"], {
            "in-viewport": a.expr.createPseudo ? a.expr.createPseudo(function(a) {
                return function(b) {
                    return d(b, f(a))
                }
            }) : function(a, b, c) {
                return d(a, f(c[3]))
            }
        }), a.fn.isInViewport = function(a) {
            return this.filter(function(b, c) {
                return d(c, a)
            })
        }
    }(jQuery, window),
    function(a, b, c) {
        function d(a, b) {
            if (a.innerText) a.innerText = b;
            else if (a.nodeValue) a.nodeValue = b;
            else {
                if (!a.textContent) return !1;
                a.textContent = b
            }
        }

        function e(a, b, c, e) {
            var f, g = a.parent();
            a.remove();
            var h = c ? c.length : 0;
            if (g.contents().length > h) return f = g.contents().eq(-1 - h), i(f, b, c, e);
            var j = g.prev();
            return f = j.contents().eq(-1), f.length ? (d(f[0], f.text() + e.ellipsis), g.remove(), c.length && j.append(c), !0) : !1
        }

        function f(a, c, f, g) {
            for (var h, i, j = a[0], k = a.text(), l = "", m = 0, n = k.length; n >= m;) h = m + (n - m >> 1), i = g.ellipsis + b.trim(k.substr(h - 1, k.length)), d(j, i), c.height() > g.maxHeight ? m = h + 1 : (n = h - 1, l = l.length > i.length ? l : i);
            return l.length > 0 ? (d(j, l), !0) : e(a, c, f, g)
        }

        function g(a, c, f, g) {
            for (var h, i, j = a[0], k = a.text(), l = "", m = 0, n = k.length; n >= m;) h = m + (n - m >> 1), i = b.trim(k.substr(0, h + 1)) + g.ellipsis, d(j, i), c.height() > g.maxHeight ? n = h - 1 : (m = h + 1, l = l.length > i.length ? l : i);
            return l.length > 0 ? (d(j, l), !0) : e(a, c, f, g)
        }

        function h(a, c, f, g) {
            for (var h, i, j = a[0], k = a.text(), l = "", m = 0, n = k.length, o = n >> 1; o >= m;) h = m + (o - m >> 1), i = b.trim(k.substr(0, h)) + g.ellipsis + k.substr(n - h, n - h), d(j, i), c.height() > g.maxHeight ? o = h - 1 : (m = h + 1, l = l.length > i.length ? l : i);
            return l.length > 0 ? (d(j, l), !0) : e(a, c, f, g)
        }

        function i(a, b, c, d) {
            return "end" === d.position ? g(a, b, c, d) : "start" === d.position ? f(a, b, c, d) : h(a, b, c, d)
        }

        function j(a, c, d, e) {
            var f, g, h = a[0],
                j = a.contents(),
                k = j.length,
                m = k - 1,
                o = !1;
            for (a.empty(); m >= 0 && !o; m--) f = j.eq(m), g = f[0], 8 !== g.nodeType && (h.insertBefore(g, h.firstChild), d.length && (b.inArray(h.tagName.toLowerCase(), n) >= 0 ? a.after(d) : a.append(d)), c.height() > e.maxHeight && (o = 3 === g.nodeType ? i(f, c, d, e) : l(f, c, d, e)), !o && d.length && d.remove());
            return o
        }

        function k(a, c, d, e) {
            var f, g, h = a[0],
                j = a.contents(),
                k = 0,
                m = j.length,
                o = !1;
            for (a.empty(); m > k && !o; k++) f = j.eq(k), g = f[0], 8 !== g.nodeType && (h.appendChild(g), d.length && (b.inArray(h.tagName.toLowerCase(), n) >= 0 ? a.after(d) : a.append(d)), c.height() > e.maxHeight && (o = 3 === g.nodeType ? i(f, c, d, e) : l(f, c, d, e)), !o && d.length && d.remove());
            return o
        }

        function l(a, b, c, d) {
            return "end" === d.position ? k(a, b, c, d) : "start" === d.position ? j(a, b, c, d) : k(a, b, c, d)
        }

        function m(a, d) {
            if (this.element = a, this.$element = b(a), this._name = "truncate", this._defaults = {
                    lines: 1,
                    ellipsis: "…",
                    showMore: "",
                    showLess: "",
                    position: "end",
                    lineHeight: "auto"
                }, this.options = b.extend({}, this._defaults, d), "auto" === this.options.lineHeight) {
                var e = this.$element.css("line-height"),
                    f = 18;
                "normal" !== e && (f = parseInt(e, 10)), this.options.lineHeight = f
            }
            this.options.maxHeight === c && (this.options.maxHeight = parseInt(this.options.lines, 10) * parseInt(this.options.lineHeight, 10)), "start" !== this.options.position && "middle" !== this.options.position && "end" !== this.options.position && (this.options.position = "end"), this.$clipNode = b(b.parseHTML(this.options.showMore), this.$element), this.original = this.cached = a.innerHTML, this.isTruncated = !1, this.isCollapsed = !0, this.update()
        }
        var n = ["table", "thead", "tbody", "tfoot", "tr", "col", "colgroup", "object", "embed", "param", "ol", "ul", "dl", "blockquote", "select", "optgroup", "option", "textarea", "script", "style"];
        m.prototype = {
            update: function(a) {
                var b = !this.isCollapsed;
                "undefined" != typeof a ? this.original = this.element.innerHTML = a : this.isCollapsed && this.element.innerHTML === this.cached && (this.element.innerHTML = this.original);
                var c = this.$element.wrapInner("<div/>").children();
                c.css({
                    border: "none",
                    margin: 0,
                    padding: 0,
                    width: "auto",
                    height: "auto"
                }), this.isTruncated = !1, c.height() > this.options.maxHeight ? this.isTruncated = l(c, c, this.$clipNode, this.options) : this.isCollapsed = !1, c.replaceWith(c.contents()), this.cached = this.element.innerHTML, b && (this.element.innerHTML = this.original)
            },
            expand: function() {
                this.isCollapsed && (this.isCollapsed = !1, this.element.innerHTML = this.isTruncated ? this.original + this.options.showLess : this.original)
            },
            collapse: function(a) {
                this.isCollapsed || (this.isCollapsed = !0, a = a || !1, a ? this.update() : this.element.innerHTML = this.cached)
            }
        }, b.fn.truncate = function(a) {
            var c = b.makeArray(arguments).slice(1);
            return this.each(function() {
                var d = b.data(this, "jquery-truncate");
                d ? "function" == typeof d[a] && d[a].apply(d, c) : b.data(this, "jquery-truncate", new m(this, a))
            })
        }, a.Truncate = m
    }(this, jQuery),
    function(a, b) {
        var c = b,
            d = function(a) {
                return this.url = a, this.trackings = {}, this.mediaFiles = [], this.url ? void 0 : void console.error("No url passed to VAST")
            };
        return d.prototype.extractData = function(a) {
            function b(e) {
                e = c(e), e.find('MediaFile[type="application/x-shockwave-flash"]').remove(), d._addTracking("impression", e.find("Impression").text());
                var f = e.find("ClickTracking").text();
                f && d._addTracking("clickTracking", f);
                var g = e.find("ClickThrough").text();
                if (g && (d.clickThrough = g), e.find("Linear Tracking").each(function(a, b) {
                        d._addTracking(b.getAttribute("event"), b.textContent)
                    }), e && e.find("InLine").length) {
                    d.staticResource = e.find("StaticResource").text(), e.find("MediaFile").each(function(a, b) {
                        var e = {};
                        c.each(b.attributes, function(a, b) {
                            b.specified && (e[b.name] = b.value)
                        }), d.mediaFiles.push({
                            source: b.textContent,
                            attributes: e
                        })
                    });
                    var h = e.find("Duration").text();
                    h && (d.duration = 60 * parseInt(h.split(":")[1]) + parseInt(h.split(":")[2])), a(null)
                } else e.find("VASTAdTagURI").length && e.find("Wrapper").length ? c.ajax({
                    url: e.find("VASTAdTagURI").text(),
                    type: "GET",
                    dataType: "xml",
                    success: function(a) {
                        b(a)
                    },
                    error: function() {
                        a(arguments)
                    }
                }) : a("Found neither Inline neither Wrapper")
            }
            var d = this;
            c.ajax({
                url: d.url,
                type: "GET",
                dataType: "xml",
                success: function(a) {
                    if (a) {
                        var e = c(a);
                        d.insertionId = e.find("insertionID").text();
                        var f = e.find('SmartMetric[name="viewcount"]').text();
                        f && f.length && d._addTracking("viewcount", c.trim(f));
                        try {
                            var g = e.find("customisedScript").text();
                            d.customisedScript = JSON.parse(g)
                        } catch (h) {
                            console.log("error parsing customScript", h)
                        }
                        b(a)
                    }
                },
                error: function() {
                    a(arguments)
                }
            })
        }, d.prototype.track = function(a) {
            c.each(this.trackings[a], function(a, b) {
                c("body").append('<img src="' + b + '" style="opacity:0">')
            })
        }, d.prototype._addTracking = function(a, b) {
            this.trackings[a] || (this.trackings[a] = []), b && b.length && this.trackings[a].push(c.trim(b))
        }, a.VAST = d
    }(window, jQuery), ! function(a, b) {
        "object" == typeof exports && "object" == typeof module ? module.exports = b() : "function" == typeof define && define.amd ? define([], b) : "object" == typeof exports ? exports.Handlebars = b() : a.Handlebars = b()
    }(this, function() {
        return function(a) {
            function b(d) {
                if (c[d]) return c[d].exports;
                var e = c[d] = {
                    exports: {},
                    id: d,
                    loaded: !1
                };
                return a[d].call(e.exports, e, e.exports, b), e.loaded = !0, e.exports
            }
            var c = {};
            return b.m = a, b.c = c, b.p = "", b(0)
        }([function(a, b, c) {
            "use strict";

            function d() {
                var a = r();
                return a.compile = function(b, c) {
                    return k.compile(b, c, a)
                }, a.precompile = function(b, c) {
                    return k.precompile(b, c, a)
                }, a.AST = i["default"], a.Compiler = k.Compiler, a.JavaScriptCompiler = m["default"], a.Parser = j.parser, a.parse = j.parse, a
            }
            var e = c(1)["default"];
            b.__esModule = !0;
            var f = c(2),
                g = e(f),
                h = c(21),
                i = e(h),
                j = c(22),
                k = c(27),
                l = c(28),
                m = e(l),
                n = c(25),
                o = e(n),
                p = c(20),
                q = e(p),
                r = g["default"].create,
                s = d();
            s.create = d, q["default"](s), s.Visitor = o["default"], s["default"] = s, b["default"] = s, a.exports = b["default"]
        }, function(a, b) {
            "use strict";
            b["default"] = function(a) {
                return a && a.__esModule ? a : {
                    "default": a
                }
            }, b.__esModule = !0
        }, function(a, b, c) {
            "use strict";

            function d() {
                var a = new h.HandlebarsEnvironment;
                return n.extend(a, h), a.SafeString = j["default"], a.Exception = l["default"], a.Utils = n, a.escapeExpression = n.escapeExpression, a.VM = p, a.template = function(b) {
                    return p.template(b, a)
                }, a
            }
            var e = c(3)["default"],
                f = c(1)["default"];
            b.__esModule = !0;
            var g = c(4),
                h = e(g),
                i = c(18),
                j = f(i),
                k = c(6),
                l = f(k),
                m = c(5),
                n = e(m),
                o = c(19),
                p = e(o),
                q = c(20),
                r = f(q),
                s = d();
            s.create = d, r["default"](s), s["default"] = s, b["default"] = s, a.exports = b["default"]
        }, function(a, b) {
            "use strict";
            b["default"] = function(a) {
                if (a && a.__esModule) return a;
                var b = {};
                if (null != a)
                    for (var c in a) Object.prototype.hasOwnProperty.call(a, c) && (b[c] = a[c]);
                return b["default"] = a, b
            }, b.__esModule = !0
        }, function(a, b, c) {
            "use strict";

            function d(a, b, c) {
                this.helpers = a || {}, this.partials = b || {}, this.decorators = c || {}, i.registerDefaultHelpers(this), j.registerDefaultDecorators(this)
            }
            var e = c(1)["default"];
            b.__esModule = !0, b.HandlebarsEnvironment = d;
            var f = c(5),
                g = c(6),
                h = e(g),
                i = c(7),
                j = c(15),
                k = c(17),
                l = e(k),
                m = "4.0.5";
            b.VERSION = m;
            var n = 7;
            b.COMPILER_REVISION = n;
            var o = {
                1: "<= 1.0.rc.2",
                2: "== 1.0.0-rc.3",
                3: "== 1.0.0-rc.4",
                4: "== 1.x.x",
                5: "== 2.0.0-alpha.x",
                6: ">= 2.0.0-beta.1",
                7: ">= 4.0.0"
            };
            b.REVISION_CHANGES = o;
            var p = "[object Object]";
            d.prototype = {
                constructor: d,
                logger: l["default"],
                log: l["default"].log,
                registerHelper: function(a, b) {
                    if (f.toString.call(a) === p) {
                        if (b) throw new h["default"]("Arg not supported with multiple helpers");
                        f.extend(this.helpers, a)
                    } else this.helpers[a] = b
                },
                unregisterHelper: function(a) {
                    delete this.helpers[a]
                },
                registerPartial: function(a, b) {
                    if (f.toString.call(a) === p) f.extend(this.partials, a);
                    else {
                        if ("undefined" == typeof b) throw new h["default"]('Attempting to register a partial called "' + a + '" as undefined');
                        this.partials[a] = b
                    }
                },
                unregisterPartial: function(a) {
                    delete this.partials[a]
                },
                registerDecorator: function(a, b) {
                    if (f.toString.call(a) === p) {
                        if (b) throw new h["default"]("Arg not supported with multiple decorators");
                        f.extend(this.decorators, a)
                    } else this.decorators[a] = b
                },
                unregisterDecorator: function(a) {
                    delete this.decorators[a]
                }
            };
            var q = l["default"].log;
            b.log = q, b.createFrame = f.createFrame, b.logger = l["default"]
        }, function(a, b) {
            "use strict";

            function c(a) {
                return k[a]
            }

            function d(a) {
                for (var b = 1; b < arguments.length; b++)
                    for (var c in arguments[b]) Object.prototype.hasOwnProperty.call(arguments[b], c) && (a[c] = arguments[b][c]);
                return a
            }

            function e(a, b) {
                for (var c = 0, d = a.length; d > c; c++)
                    if (a[c] === b) return c;
                return -1
            }

            function f(a) {
                if ("string" != typeof a) {
                    if (a && a.toHTML) return a.toHTML();
                    if (null == a) return "";
                    if (!a) return a + "";
                    a = "" + a
                }
                return m.test(a) ? a.replace(l, c) : a
            }

            function g(a) {
                return a || 0 === a ? p(a) && 0 === a.length ? !0 : !1 : !0
            }

            function h(a) {
                var b = d({}, a);
                return b._parent = a, b
            }

            function i(a, b) {
                return a.path = b, a
            }

            function j(a, b) {
                return (a ? a + "." : "") + b
            }
            b.__esModule = !0, b.extend = d, b.indexOf = e, b.escapeExpression = f, b.isEmpty = g, b.createFrame = h, b.blockParams = i, b.appendContextPath = j;
            var k = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#x27;",
                    "`": "&#x60;",
                    "=": "&#x3D;"
                },
                l = /[&<>"'`=]/g,
                m = /[&<>"'`=]/,
                n = Object.prototype.toString;
            b.toString = n;
            var o = function(a) {
                return "function" == typeof a
            };
            o(/x/) && (b.isFunction = o = function(a) {
                return "function" == typeof a && "[object Function]" === n.call(a)
            }), b.isFunction = o;
            var p = Array.isArray || function(a) {
                return a && "object" == typeof a ? "[object Array]" === n.call(a) : !1
            };
            b.isArray = p
        }, function(a, b) {
            "use strict";

            function c(a, b) {
                var e = b && b.loc,
                    f = void 0,
                    g = void 0;
                e && (f = e.start.line, g = e.start.column, a += " - " + f + ":" + g);
                for (var h = Error.prototype.constructor.call(this, a), i = 0; i < d.length; i++) this[d[i]] = h[d[i]];
                Error.captureStackTrace && Error.captureStackTrace(this, c), e && (this.lineNumber = f, this.column = g)
            }
            b.__esModule = !0;
            var d = ["description", "fileName", "lineNumber", "message", "name", "number", "stack"];
            c.prototype = new Error, b["default"] = c, a.exports = b["default"]
        }, function(a, b, c) {
            "use strict";

            function d(a) {
                g["default"](a), i["default"](a), k["default"](a), m["default"](a), o["default"](a), q["default"](a), s["default"](a)
            }
            var e = c(1)["default"];
            b.__esModule = !0, b.registerDefaultHelpers = d;
            var f = c(8),
                g = e(f),
                h = c(9),
                i = e(h),
                j = c(10),
                k = e(j),
                l = c(11),
                m = e(l),
                n = c(12),
                o = e(n),
                p = c(13),
                q = e(p),
                r = c(14),
                s = e(r)
        }, function(a, b, c) {
            "use strict";
            b.__esModule = !0;
            var d = c(5);
            b["default"] = function(a) {
                a.registerHelper("blockHelperMissing", function(b, c) {
                    var e = c.inverse,
                        f = c.fn;
                    if (b === !0) return f(this);
                    if (b === !1 || null == b) return e(this);
                    if (d.isArray(b)) return b.length > 0 ? (c.ids && (c.ids = [c.name]), a.helpers.each(b, c)) : e(this);
                    if (c.data && c.ids) {
                        var g = d.createFrame(c.data);
                        g.contextPath = d.appendContextPath(c.data.contextPath, c.name), c = {
                            data: g
                        }
                    }
                    return f(b, c)
                })
            }, a.exports = b["default"]
        }, function(a, b, c) {
            "use strict";
            var d = c(1)["default"];
            b.__esModule = !0;
            var e = c(5),
                f = c(6),
                g = d(f);
            b["default"] = function(a) {
                a.registerHelper("each", function(a, b) {
                    function c(b, c, f) {
                        j && (j.key = b, j.index = c, j.first = 0 === c, j.last = !!f, k && (j.contextPath = k + b)), i += d(a[b], {
                            data: j,
                            blockParams: e.blockParams([a[b], b], [k + b, null])
                        })
                    }
                    if (!b) throw new g["default"]("Must pass iterator to #each");
                    var d = b.fn,
                        f = b.inverse,
                        h = 0,
                        i = "",
                        j = void 0,
                        k = void 0;
                    if (b.data && b.ids && (k = e.appendContextPath(b.data.contextPath, b.ids[0]) + "."), e.isFunction(a) && (a = a.call(this)), b.data && (j = e.createFrame(b.data)), a && "object" == typeof a)
                        if (e.isArray(a))
                            for (var l = a.length; l > h; h++) h in a && c(h, h, h === a.length - 1);
                        else {
                            var m = void 0;
                            for (var n in a) a.hasOwnProperty(n) && (void 0 !== m && c(m, h - 1), m = n, h++);
                            void 0 !== m && c(m, h - 1, !0)
                        }
                    return 0 === h && (i = f(this)), i
                })
            }, a.exports = b["default"]
        }, function(a, b, c) {
            "use strict";
            var d = c(1)["default"];
            b.__esModule = !0;
            var e = c(6),
                f = d(e);
            b["default"] = function(a) {
                a.registerHelper("helperMissing", function() {
                    if (1 !== arguments.length) throw new f["default"]('Missing helper: "' + arguments[arguments.length - 1].name + '"')
                })
            }, a.exports = b["default"]
        }, function(a, b, c) {
            "use strict";
            b.__esModule = !0;
            var d = c(5);
            b["default"] = function(a) {
                a.registerHelper("if", function(a, b) {
                    return d.isFunction(a) && (a = a.call(this)), !b.hash.includeZero && !a || d.isEmpty(a) ? b.inverse(this) : b.fn(this)
                }), a.registerHelper("unless", function(b, c) {
                    return a.helpers["if"].call(this, b, {
                        fn: c.inverse,
                        inverse: c.fn,
                        hash: c.hash
                    })
                })
            }, a.exports = b["default"]
        }, function(a, b) {
            "use strict";
            b.__esModule = !0, b["default"] = function(a) {
                a.registerHelper("log", function() {
                    for (var b = [void 0], c = arguments[arguments.length - 1], d = 0; d < arguments.length - 1; d++) b.push(arguments[d]);
                    var e = 1;
                    null != c.hash.level ? e = c.hash.level : c.data && null != c.data.level && (e = c.data.level), b[0] = e, a.log.apply(a, b)
                })
            }, a.exports = b["default"]
        }, function(a, b) {
            "use strict";
            b.__esModule = !0, b["default"] = function(a) {
                a.registerHelper("lookup", function(a, b) {
                    return a && a[b]
                })
            }, a.exports = b["default"]
        }, function(a, b, c) {
            "use strict";
            b.__esModule = !0;
            var d = c(5);
            b["default"] = function(a) {
                a.registerHelper("with", function(a, b) {
                    d.isFunction(a) && (a = a.call(this));
                    var c = b.fn;
                    if (d.isEmpty(a)) return b.inverse(this);
                    var e = b.data;
                    return b.data && b.ids && (e = d.createFrame(b.data), e.contextPath = d.appendContextPath(b.data.contextPath, b.ids[0])), c(a, {
                        data: e,
                        blockParams: d.blockParams([a], [e && e.contextPath])
                    })
                })
            }, a.exports = b["default"]
        }, function(a, b, c) {
            "use strict";

            function d(a) {
                g["default"](a)
            }
            var e = c(1)["default"];
            b.__esModule = !0, b.registerDefaultDecorators = d;
            var f = c(16),
                g = e(f)
        }, function(a, b, c) {
            "use strict";
            b.__esModule = !0;
            var d = c(5);
            b["default"] = function(a) {
                a.registerDecorator("inline", function(a, b, c, e) {
                    var f = a;
                    return b.partials || (b.partials = {}, f = function(e, f) {
                        var g = c.partials;
                        c.partials = d.extend({}, g, b.partials);
                        var h = a(e, f);
                        return c.partials = g, h
                    }), b.partials[e.args[0]] = e.fn, f
                })
            }, a.exports = b["default"]
        }, function(a, b, c) {
            "use strict";
            b.__esModule = !0;
            var d = c(5),
                e = {
                    methodMap: ["debug", "info", "warn", "error"],
                    level: "info",
                    lookupLevel: function(a) {
                        if ("string" == typeof a) {
                            var b = d.indexOf(e.methodMap, a.toLowerCase());
                            a = b >= 0 ? b : parseInt(a, 10)
                        }
                        return a
                    },
                    log: function(a) {
                        if (a = e.lookupLevel(a), "undefined" != typeof console && e.lookupLevel(e.level) <= a) {
                            var b = e.methodMap[a];
                            console[b] || (b = "log");
                            for (var c = arguments.length, d = Array(c > 1 ? c - 1 : 0), f = 1; c > f; f++) d[f - 1] = arguments[f];
                            console[b].apply(console, d)
                        }
                    }
                };
            b["default"] = e, a.exports = b["default"]
        }, function(a, b) {
            "use strict";

            function c(a) {
                this.string = a
            }
            b.__esModule = !0, c.prototype.toString = c.prototype.toHTML = function() {
                return "" + this.string
            }, b["default"] = c, a.exports = b["default"]
        }, function(a, b, c) {
            "use strict";

            function d(a) {
                var b = a && a[0] || 1,
                    c = r.COMPILER_REVISION;
                if (b !== c) {
                    if (c > b) {
                        var d = r.REVISION_CHANGES[c],
                            e = r.REVISION_CHANGES[b];
                        throw new q["default"]("Template was precompiled with an older version of Handlebars than the current runtime. Please update your precompiler to a newer version (" + d + ") or downgrade your runtime to an older version (" + e + ").")
                    }
                    throw new q["default"]("Template was precompiled with a newer version of Handlebars than the current runtime. Please update your runtime to a newer version (" + a[1] + ").")
                }
            }

            function e(a, b) {
                function c(c, d, e) {
                    e.hash && (d = o.extend({}, d, e.hash), e.ids && (e.ids[0] = !0)), c = b.VM.resolvePartial.call(this, c, d, e);
                    var f = b.VM.invokePartial.call(this, c, d, e);
                    if (null == f && b.compile && (e.partials[e.name] = b.compile(c, a.compilerOptions, b), f = e.partials[e.name](d, e)), null != f) {
                        if (e.indent) {
                            for (var g = f.split("\n"), h = 0, i = g.length; i > h && (g[h] || h + 1 !== i); h++) g[h] = e.indent + g[h];
                            f = g.join("\n")
                        }
                        return f
                    }
                    throw new q["default"]("The partial " + e.name + " could not be compiled when running in runtime-only mode")
                }

                function d(b) {
                    function c(b) {
                        return "" + a.main(e, b, e.helpers, e.partials, g, i, h)
                    }
                    var f = arguments.length <= 1 || void 0 === arguments[1] ? {} : arguments[1],
                        g = f.data;
                    d._setup(f), !f.partial && a.useData && (g = j(b, g));
                    var h = void 0,
                        i = a.useBlockParams ? [] : void 0;
                    return a.useDepths && (h = f.depths ? b !== f.depths[0] ? [b].concat(f.depths) : f.depths : [b]), (c = k(a.main, c, e, f.depths || [], g, i))(b, f)
                }
                if (!b) throw new q["default"]("No environment passed to template");
                if (!a || !a.main) throw new q["default"]("Unknown template object: " + typeof a);
                a.main.decorator = a.main_d, b.VM.checkRevision(a.compiler);
                var e = {
                    strict: function(a, b) {
                        if (!(b in a)) throw new q["default"]('"' + b + '" not defined in ' + a);
                        return a[b]
                    },
                    lookup: function(a, b) {
                        for (var c = a.length, d = 0; c > d; d++)
                            if (a[d] && null != a[d][b]) return a[d][b]
                    },
                    lambda: function(a, b) {
                        return "function" == typeof a ? a.call(b) : a
                    },
                    escapeExpression: o.escapeExpression,
                    invokePartial: c,
                    fn: function(b) {
                        var c = a[b];
                        return c.decorator = a[b + "_d"], c
                    },
                    programs: [],
                    program: function(a, b, c, d, e) {
                        var g = this.programs[a],
                            h = this.fn(a);
                        return b || e || d || c ? g = f(this, a, h, b, c, d, e) : g || (g = this.programs[a] = f(this, a, h)), g
                    },
                    data: function(a, b) {
                        for (; a && b--;) a = a._parent;
                        return a
                    },
                    merge: function(a, b) {
                        var c = a || b;
                        return a && b && a !== b && (c = o.extend({}, b, a)), c
                    },
                    noop: b.VM.noop,
                    compilerInfo: a.compiler
                };
                return d.isTop = !0, d._setup = function(c) {
                    c.partial ? (e.helpers = c.helpers, e.partials = c.partials, e.decorators = c.decorators) : (e.helpers = e.merge(c.helpers, b.helpers), a.usePartial && (e.partials = e.merge(c.partials, b.partials)), (a.usePartial || a.useDecorators) && (e.decorators = e.merge(c.decorators, b.decorators)))
                }, d._child = function(b, c, d, g) {
                    if (a.useBlockParams && !d) throw new q["default"]("must pass block params");
                    if (a.useDepths && !g) throw new q["default"]("must pass parent depths");
                    return f(e, b, a[b], c, 0, d, g)
                }, d
            }

            function f(a, b, c, d, e, f, g) {
                function h(b) {
                    var e = arguments.length <= 1 || void 0 === arguments[1] ? {} : arguments[1],
                        h = g;
                    return g && b !== g[0] && (h = [b].concat(g)), c(a, b, a.helpers, a.partials, e.data || d, f && [e.blockParams].concat(f), h)
                }
                return h = k(c, h, a, g, d, f), h.program = b, h.depth = g ? g.length : 0, h.blockParams = e || 0, h
            }

            function g(a, b, c) {
                return a ? a.call || c.name || (c.name = a, a = c.partials[a]) : a = "@partial-block" === c.name ? c.data["partial-block"] : c.partials[c.name], a
            }

            function h(a, b, c) {
                c.partial = !0, c.ids && (c.data.contextPath = c.ids[0] || c.data.contextPath);
                var d = void 0;
                if (c.fn && c.fn !== i && (c.data = r.createFrame(c.data), d = c.data["partial-block"] = c.fn, d.partials && (c.partials = o.extend({}, c.partials, d.partials))), void 0 === a && d && (a = d), void 0 === a) throw new q["default"]("The partial " + c.name + " could not be found");
                return a instanceof Function ? a(b, c) : void 0
            }

            function i() {
                return ""
            }

            function j(a, b) {
                return b && "root" in b || (b = b ? r.createFrame(b) : {}, b.root = a), b
            }

            function k(a, b, c, d, e, f) {
                if (a.decorator) {
                    var g = {};
                    b = a.decorator(b, g, c, d && d[0], e, f, d), o.extend(b, g)
                }
                return b
            }
            var l = c(3)["default"],
                m = c(1)["default"];
            b.__esModule = !0, b.checkRevision = d, b.template = e, b.wrapProgram = f, b.resolvePartial = g, b.invokePartial = h, b.noop = i;
            var n = c(5),
                o = l(n),
                p = c(6),
                q = m(p),
                r = c(4)
        }, function(a, b) {
            (function(c) {
                "use strict";
                b.__esModule = !0, b["default"] = function(a) {
                    var b = "undefined" != typeof c ? c : window,
                        d = b.Handlebars;
                    a.noConflict = function() {
                        return b.Handlebars === a && (b.Handlebars = d), a
                    }
                }, a.exports = b["default"]
            }).call(b, function() {
                return this
            }())
        }, function(a, b) {
            "use strict";
            b.__esModule = !0;
            var c = {
                helpers: {
                    helperExpression: function(a) {
                        return "SubExpression" === a.type || ("MustacheStatement" === a.type || "BlockStatement" === a.type) && !!(a.params && a.params.length || a.hash)
                    },
                    scopedId: function(a) {
                        return /^\.|this\b/.test(a.original)
                    },
                    simpleId: function(a) {
                        return 1 === a.parts.length && !c.helpers.scopedId(a) && !a.depth
                    }
                }
            };
            b["default"] = c, a.exports = b["default"]
        }, function(a, b, c) {
            "use strict";

            function d(a, b) {
                if ("Program" === a.type) return a;
                h["default"].yy = n, n.locInfo = function(a) {
                    return new n.SourceLocation(b && b.srcName, a)
                };
                var c = new j["default"](b);
                return c.accept(h["default"].parse(a))
            }
            var e = c(1)["default"],
                f = c(3)["default"];
            b.__esModule = !0, b.parse = d;
            var g = c(23),
                h = e(g),
                i = c(24),
                j = e(i),
                k = c(26),
                l = f(k),
                m = c(5);
            b.parser = h["default"];
            var n = {};
            m.extend(n, l)
        }, function(a, b) {
            "use strict";
            var c = function() {
                function a() {
                    this.yy = {}
                }
                var b = {
                        trace: function() {},
                        yy: {},
                        symbols_: {
                            error: 2,
                            root: 3,
                            program: 4,
                            EOF: 5,
                            program_repetition0: 6,
                            statement: 7,
                            mustache: 8,
                            block: 9,
                            rawBlock: 10,
                            partial: 11,
                            partialBlock: 12,
                            content: 13,
                            COMMENT: 14,
                            CONTENT: 15,
                            openRawBlock: 16,
                            rawBlock_repetition_plus0: 17,
                            END_RAW_BLOCK: 18,
                            OPEN_RAW_BLOCK: 19,
                            helperName: 20,
                            openRawBlock_repetition0: 21,
                            openRawBlock_option0: 22,
                            CLOSE_RAW_BLOCK: 23,
                            openBlock: 24,
                            block_option0: 25,
                            closeBlock: 26,
                            openInverse: 27,
                            block_option1: 28,
                            OPEN_BLOCK: 29,
                            openBlock_repetition0: 30,
                            openBlock_option0: 31,
                            openBlock_option1: 32,
                            CLOSE: 33,
                            OPEN_INVERSE: 34,
                            openInverse_repetition0: 35,
                            openInverse_option0: 36,
                            openInverse_option1: 37,
                            openInverseChain: 38,
                            OPEN_INVERSE_CHAIN: 39,
                            openInverseChain_repetition0: 40,
                            openInverseChain_option0: 41,
                            openInverseChain_option1: 42,
                            inverseAndProgram: 43,
                            INVERSE: 44,
                            inverseChain: 45,
                            inverseChain_option0: 46,
                            OPEN_ENDBLOCK: 47,
                            OPEN: 48,
                            mustache_repetition0: 49,
                            mustache_option0: 50,
                            OPEN_UNESCAPED: 51,
                            mustache_repetition1: 52,
                            mustache_option1: 53,
                            CLOSE_UNESCAPED: 54,
                            OPEN_PARTIAL: 55,
                            partialName: 56,
                            partial_repetition0: 57,
                            partial_option0: 58,
                            openPartialBlock: 59,
                            OPEN_PARTIAL_BLOCK: 60,
                            openPartialBlock_repetition0: 61,
                            openPartialBlock_option0: 62,
                            param: 63,
                            sexpr: 64,
                            OPEN_SEXPR: 65,
                            sexpr_repetition0: 66,
                            sexpr_option0: 67,
                            CLOSE_SEXPR: 68,
                            hash: 69,
                            hash_repetition_plus0: 70,
                            hashSegment: 71,
                            ID: 72,
                            EQUALS: 73,
                            blockParams: 74,
                            OPEN_BLOCK_PARAMS: 75,
                            blockParams_repetition_plus0: 76,
                            CLOSE_BLOCK_PARAMS: 77,
                            path: 78,
                            dataName: 79,
                            STRING: 80,
                            NUMBER: 81,
                            BOOLEAN: 82,
                            UNDEFINED: 83,
                            NULL: 84,
                            DATA: 85,
                            pathSegments: 86,
                            SEP: 87,
                            $accept: 0,
                            $end: 1
                        },
                        terminals_: {
                            2: "error",
                            5: "EOF",
                            14: "COMMENT",
                            15: "CONTENT",
                            18: "END_RAW_BLOCK",
                            19: "OPEN_RAW_BLOCK",
                            23: "CLOSE_RAW_BLOCK",
                            29: "OPEN_BLOCK",
                            33: "CLOSE",
                            34: "OPEN_INVERSE",
                            39: "OPEN_INVERSE_CHAIN",
                            44: "INVERSE",
                            47: "OPEN_ENDBLOCK",
                            48: "OPEN",
                            51: "OPEN_UNESCAPED",
                            54: "CLOSE_UNESCAPED",
                            55: "OPEN_PARTIAL",
                            60: "OPEN_PARTIAL_BLOCK",
                            65: "OPEN_SEXPR",
                            68: "CLOSE_SEXPR",
                            72: "ID",
                            73: "EQUALS",
                            75: "OPEN_BLOCK_PARAMS",
                            77: "CLOSE_BLOCK_PARAMS",
                            80: "STRING",
                            81: "NUMBER",
                            82: "BOOLEAN",
                            83: "UNDEFINED",
                            84: "NULL",
                            85: "DATA",
                            87: "SEP"
                        },
                        productions_: [0, [3, 2],
                            [4, 1],
                            [7, 1],
                            [7, 1],
                            [7, 1],
                            [7, 1],
                            [7, 1],
                            [7, 1],
                            [7, 1],
                            [13, 1],
                            [10, 3],
                            [16, 5],
                            [9, 4],
                            [9, 4],
                            [24, 6],
                            [27, 6],
                            [38, 6],
                            [43, 2],
                            [45, 3],
                            [45, 1],
                            [26, 3],
                            [8, 5],
                            [8, 5],
                            [11, 5],
                            [12, 3],
                            [59, 5],
                            [63, 1],
                            [63, 1],
                            [64, 5],
                            [69, 1],
                            [71, 3],
                            [74, 3],
                            [20, 1],
                            [20, 1],
                            [20, 1],
                            [20, 1],
                            [20, 1],
                            [20, 1],
                            [20, 1],
                            [56, 1],
                            [56, 1],
                            [79, 2],
                            [78, 1],
                            [86, 3],
                            [86, 1],
                            [6, 0],
                            [6, 2],
                            [17, 1],
                            [17, 2],
                            [21, 0],
                            [21, 2],
                            [22, 0],
                            [22, 1],
                            [25, 0],
                            [25, 1],
                            [28, 0],
                            [28, 1],
                            [30, 0],
                            [30, 2],
                            [31, 0],
                            [31, 1],
                            [32, 0],
                            [32, 1],
                            [35, 0],
                            [35, 2],
                            [36, 0],
                            [36, 1],
                            [37, 0],
                            [37, 1],
                            [40, 0],
                            [40, 2],
                            [41, 0],
                            [41, 1],
                            [42, 0],
                            [42, 1],
                            [46, 0],
                            [46, 1],
                            [49, 0],
                            [49, 2],
                            [50, 0],
                            [50, 1],
                            [52, 0],
                            [52, 2],
                            [53, 0],
                            [53, 1],
                            [57, 0],
                            [57, 2],
                            [58, 0],
                            [58, 1],
                            [61, 0],
                            [61, 2],
                            [62, 0],
                            [62, 1],
                            [66, 0],
                            [66, 2],
                            [67, 0],
                            [67, 1],
                            [70, 1],
                            [70, 2],
                            [76, 1],
                            [76, 2]
                        ],
                        performAction: function(a, b, c, d, e, f, g) {
                            var h = f.length - 1;
                            switch (e) {
                                case 1:
                                    return f[h - 1];
                                case 2:
                                    this.$ = d.prepareProgram(f[h]);
                                    break;
                                case 3:
                                    this.$ = f[h];
                                    break;
                                case 4:
                                    this.$ = f[h];
                                    break;
                                case 5:
                                    this.$ = f[h];
                                    break;
                                case 6:
                                    this.$ = f[h];
                                    break;
                                case 7:
                                    this.$ = f[h];
                                    break;
                                case 8:
                                    this.$ = f[h];
                                    break;
                                case 9:
                                    this.$ = {
                                        type: "CommentStatement",
                                        value: d.stripComment(f[h]),
                                        strip: d.stripFlags(f[h], f[h]),
                                        loc: d.locInfo(this._$)
                                    };
                                    break;
                                case 10:
                                    this.$ = {
                                        type: "ContentStatement",
                                        original: f[h],
                                        value: f[h],
                                        loc: d.locInfo(this._$)
                                    };
                                    break;
                                case 11:
                                    this.$ = d.prepareRawBlock(f[h - 2], f[h - 1], f[h], this._$);
                                    break;
                                case 12:
                                    this.$ = {
                                        path: f[h - 3],
                                        params: f[h - 2],
                                        hash: f[h - 1]
                                    };
                                    break;
                                case 13:
                                    this.$ = d.prepareBlock(f[h - 3], f[h - 2], f[h - 1], f[h], !1, this._$);
                                    break;
                                case 14:
                                    this.$ = d.prepareBlock(f[h - 3], f[h - 2], f[h - 1], f[h], !0, this._$);
                                    break;
                                case 15:
                                    this.$ = {
                                        open: f[h - 5],
                                        path: f[h - 4],
                                        params: f[h - 3],
                                        hash: f[h - 2],
                                        blockParams: f[h - 1],
                                        strip: d.stripFlags(f[h - 5], f[h])
                                    };
                                    break;
                                case 16:
                                    this.$ = {
                                        path: f[h - 4],
                                        params: f[h - 3],
                                        hash: f[h - 2],
                                        blockParams: f[h - 1],
                                        strip: d.stripFlags(f[h - 5], f[h])
                                    };
                                    break;
                                case 17:
                                    this.$ = {
                                        path: f[h - 4],
                                        params: f[h - 3],
                                        hash: f[h - 2],
                                        blockParams: f[h - 1],
                                        strip: d.stripFlags(f[h - 5], f[h])
                                    };
                                    break;
                                case 18:
                                    this.$ = {
                                        strip: d.stripFlags(f[h - 1], f[h - 1]),
                                        program: f[h]
                                    };
                                    break;
                                case 19:
                                    var i = d.prepareBlock(f[h - 2], f[h - 1], f[h], f[h], !1, this._$),
                                        j = d.prepareProgram([i], f[h - 1].loc);
                                    j.chained = !0, this.$ = {
                                        strip: f[h - 2].strip,
                                        program: j,
                                        chain: !0
                                    };
                                    break;
                                case 20:
                                    this.$ = f[h];
                                    break;
                                case 21:
                                    this.$ = {
                                        path: f[h - 1],
                                        strip: d.stripFlags(f[h - 2], f[h])
                                    };
                                    break;
                                case 22:
                                    this.$ = d.prepareMustache(f[h - 3], f[h - 2], f[h - 1], f[h - 4], d.stripFlags(f[h - 4], f[h]), this._$);
                                    break;
                                case 23:
                                    this.$ = d.prepareMustache(f[h - 3], f[h - 2], f[h - 1], f[h - 4], d.stripFlags(f[h - 4], f[h]), this._$);
                                    break;
                                case 24:
                                    this.$ = {
                                        type: "PartialStatement",
                                        name: f[h - 3],
                                        params: f[h - 2],
                                        hash: f[h - 1],
                                        indent: "",
                                        strip: d.stripFlags(f[h - 4], f[h]),
                                        loc: d.locInfo(this._$)
                                    };
                                    break;
                                case 25:
                                    this.$ = d.preparePartialBlock(f[h - 2], f[h - 1], f[h], this._$);
                                    break;
                                case 26:
                                    this.$ = {
                                        path: f[h - 3],
                                        params: f[h - 2],
                                        hash: f[h - 1],
                                        strip: d.stripFlags(f[h - 4], f[h])
                                    };
                                    break;
                                case 27:
                                    this.$ = f[h];
                                    break;
                                case 28:
                                    this.$ = f[h];
                                    break;
                                case 29:
                                    this.$ = {
                                        type: "SubExpression",
                                        path: f[h - 3],
                                        params: f[h - 2],
                                        hash: f[h - 1],
                                        loc: d.locInfo(this._$)
                                    };
                                    break;
                                case 30:
                                    this.$ = {
                                        type: "Hash",
                                        pairs: f[h],
                                        loc: d.locInfo(this._$)
                                    };
                                    break;
                                case 31:
                                    this.$ = {
                                        type: "HashPair",
                                        key: d.id(f[h - 2]),
                                        value: f[h],
                                        loc: d.locInfo(this._$)
                                    };
                                    break;
                                case 32:
                                    this.$ = d.id(f[h - 1]);
                                    break;
                                case 33:
                                    this.$ = f[h];
                                    break;
                                case 34:
                                    this.$ = f[h];
                                    break;
                                case 35:
                                    this.$ = {
                                        type: "StringLiteral",
                                        value: f[h],
                                        original: f[h],
                                        loc: d.locInfo(this._$)
                                    };
                                    break;
                                case 36:
                                    this.$ = {
                                        type: "NumberLiteral",
                                        value: Number(f[h]),
                                        original: Number(f[h]),
                                        loc: d.locInfo(this._$)
                                    };
                                    break;
                                case 37:
                                    this.$ = {
                                        type: "BooleanLiteral",
                                        value: "true" === f[h],
                                        original: "true" === f[h],
                                        loc: d.locInfo(this._$)
                                    };
                                    break;
                                case 38:
                                    this.$ = {
                                        type: "UndefinedLiteral",
                                        original: void 0,
                                        value: void 0,
                                        loc: d.locInfo(this._$)
                                    };
                                    break;
                                case 39:
                                    this.$ = {
                                        type: "NullLiteral",
                                        original: null,
                                        value: null,
                                        loc: d.locInfo(this._$)
                                    };
                                    break;
                                case 40:
                                    this.$ = f[h];
                                    break;
                                case 41:
                                    this.$ = f[h];
                                    break;
                                case 42:
                                    this.$ = d.preparePath(!0, f[h], this._$);
                                    break;
                                case 43:
                                    this.$ = d.preparePath(!1, f[h], this._$);
                                    break;
                                case 44:
                                    f[h - 2].push({
                                        part: d.id(f[h]),
                                        original: f[h],
                                        separator: f[h - 1]
                                    }), this.$ = f[h - 2];
                                    break;
                                case 45:
                                    this.$ = [{
                                        part: d.id(f[h]),
                                        original: f[h]
                                    }];
                                    break;
                                case 46:
                                    this.$ = [];
                                    break;
                                case 47:
                                    f[h - 1].push(f[h]);
                                    break;
                                case 48:
                                    this.$ = [f[h]];
                                    break;
                                case 49:
                                    f[h - 1].push(f[h]);
                                    break;
                                case 50:
                                    this.$ = [];
                                    break;
                                case 51:
                                    f[h - 1].push(f[h]);
                                    break;
                                case 58:
                                    this.$ = [];
                                    break;
                                case 59:
                                    f[h - 1].push(f[h]);
                                    break;
                                case 64:
                                    this.$ = [];
                                    break;
                                case 65:
                                    f[h - 1].push(f[h]);
                                    break;
                                case 70:
                                    this.$ = [];
                                    break;
                                case 71:
                                    f[h - 1].push(f[h]);
                                    break;
                                case 78:
                                    this.$ = [];
                                    break;
                                case 79:
                                    f[h - 1].push(f[h]);
                                    break;
                                case 82:
                                    this.$ = [];
                                    break;
                                case 83:
                                    f[h - 1].push(f[h]);
                                    break;
                                case 86:
                                    this.$ = [];
                                    break;
                                case 87:
                                    f[h - 1].push(f[h]);
                                    break;
                                case 90:
                                    this.$ = [];
                                    break;
                                case 91:
                                    f[h - 1].push(f[h]);
                                    break;
                                case 94:
                                    this.$ = [];
                                    break;
                                case 95:
                                    f[h - 1].push(f[h]);
                                    break;
                                case 98:
                                    this.$ = [f[h]];
                                    break;
                                case 99:
                                    f[h - 1].push(f[h]);
                                    break;
                                case 100:
                                    this.$ = [f[h]];
                                    break;
                                case 101:
                                    f[h - 1].push(f[h])
                            }
                        },
                        table: [{
                            3: 1,
                            4: 2,
                            5: [2, 46],
                            6: 3,
                            14: [2, 46],
                            15: [2, 46],
                            19: [2, 46],
                            29: [2, 46],
                            34: [2, 46],
                            48: [2, 46],
                            51: [2, 46],
                            55: [2, 46],
                            60: [2, 46]
                        }, {
                            1: [3]
                        }, {
                            5: [1, 4]
                        }, {
                            5: [2, 2],
                            7: 5,
                            8: 6,
                            9: 7,
                            10: 8,
                            11: 9,
                            12: 10,
                            13: 11,
                            14: [1, 12],
                            15: [1, 20],
                            16: 17,
                            19: [1, 23],
                            24: 15,
                            27: 16,
                            29: [1, 21],
                            34: [1, 22],
                            39: [2, 2],
                            44: [2, 2],
                            47: [2, 2],
                            48: [1, 13],
                            51: [1, 14],
                            55: [1, 18],
                            59: 19,
                            60: [1, 24]
                        }, {
                            1: [2, 1]
                        }, {
                            5: [2, 47],
                            14: [2, 47],
                            15: [2, 47],
                            19: [2, 47],
                            29: [2, 47],
                            34: [2, 47],
                            39: [2, 47],
                            44: [2, 47],
                            47: [2, 47],
                            48: [2, 47],
                            51: [2, 47],
                            55: [2, 47],
                            60: [2, 47]
                        }, {
                            5: [2, 3],
                            14: [2, 3],
                            15: [2, 3],
                            19: [2, 3],
                            29: [2, 3],
                            34: [2, 3],
                            39: [2, 3],
                            44: [2, 3],
                            47: [2, 3],
                            48: [2, 3],
                            51: [2, 3],
                            55: [2, 3],
                            60: [2, 3]
                        }, {
                            5: [2, 4],
                            14: [2, 4],
                            15: [2, 4],
                            19: [2, 4],
                            29: [2, 4],
                            34: [2, 4],
                            39: [2, 4],
                            44: [2, 4],
                            47: [2, 4],
                            48: [2, 4],
                            51: [2, 4],
                            55: [2, 4],
                            60: [2, 4]
                        }, {
                            5: [2, 5],
                            14: [2, 5],
                            15: [2, 5],
                            19: [2, 5],
                            29: [2, 5],
                            34: [2, 5],
                            39: [2, 5],
                            44: [2, 5],
                            47: [2, 5],
                            48: [2, 5],
                            51: [2, 5],
                            55: [2, 5],
                            60: [2, 5]
                        }, {
                            5: [2, 6],
                            14: [2, 6],
                            15: [2, 6],
                            19: [2, 6],
                            29: [2, 6],
                            34: [2, 6],
                            39: [2, 6],
                            44: [2, 6],
                            47: [2, 6],
                            48: [2, 6],
                            51: [2, 6],
                            55: [2, 6],
                            60: [2, 6]
                        }, {
                            5: [2, 7],
                            14: [2, 7],
                            15: [2, 7],
                            19: [2, 7],
                            29: [2, 7],
                            34: [2, 7],
                            39: [2, 7],
                            44: [2, 7],
                            47: [2, 7],
                            48: [2, 7],
                            51: [2, 7],
                            55: [2, 7],
                            60: [2, 7]
                        }, {
                            5: [2, 8],
                            14: [2, 8],
                            15: [2, 8],
                            19: [2, 8],
                            29: [2, 8],
                            34: [2, 8],
                            39: [2, 8],
                            44: [2, 8],
                            47: [2, 8],
                            48: [2, 8],
                            51: [2, 8],
                            55: [2, 8],
                            60: [2, 8]
                        }, {
                            5: [2, 9],
                            14: [2, 9],
                            15: [2, 9],
                            19: [2, 9],
                            29: [2, 9],
                            34: [2, 9],
                            39: [2, 9],
                            44: [2, 9],
                            47: [2, 9],
                            48: [2, 9],
                            51: [2, 9],
                            55: [2, 9],
                            60: [2, 9]
                        }, {
                            20: 25,
                            72: [1, 35],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            20: 36,
                            72: [1, 35],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            4: 37,
                            6: 3,
                            14: [2, 46],
                            15: [2, 46],
                            19: [2, 46],
                            29: [2, 46],
                            34: [2, 46],
                            39: [2, 46],
                            44: [2, 46],
                            47: [2, 46],
                            48: [2, 46],
                            51: [2, 46],
                            55: [2, 46],
                            60: [2, 46]
                        }, {
                            4: 38,
                            6: 3,
                            14: [2, 46],
                            15: [2, 46],
                            19: [2, 46],
                            29: [2, 46],
                            34: [2, 46],
                            44: [2, 46],
                            47: [2, 46],
                            48: [2, 46],
                            51: [2, 46],
                            55: [2, 46],
                            60: [2, 46]
                        }, {
                            13: 40,
                            15: [1, 20],
                            17: 39
                        }, {
                            20: 42,
                            56: 41,
                            64: 43,
                            65: [1, 44],
                            72: [1, 35],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            4: 45,
                            6: 3,
                            14: [2, 46],
                            15: [2, 46],
                            19: [2, 46],
                            29: [2, 46],
                            34: [2, 46],
                            47: [2, 46],
                            48: [2, 46],
                            51: [2, 46],
                            55: [2, 46],
                            60: [2, 46]
                        }, {
                            5: [2, 10],
                            14: [2, 10],
                            15: [2, 10],
                            18: [2, 10],
                            19: [2, 10],
                            29: [2, 10],
                            34: [2, 10],
                            39: [2, 10],
                            44: [2, 10],
                            47: [2, 10],
                            48: [2, 10],
                            51: [2, 10],
                            55: [2, 10],
                            60: [2, 10]
                        }, {
                            20: 46,
                            72: [1, 35],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            20: 47,
                            72: [1, 35],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            20: 48,
                            72: [1, 35],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            20: 42,
                            56: 49,
                            64: 43,
                            65: [1, 44],
                            72: [1, 35],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            33: [2, 78],
                            49: 50,
                            65: [2, 78],
                            72: [2, 78],
                            80: [2, 78],
                            81: [2, 78],
                            82: [2, 78],
                            83: [2, 78],
                            84: [2, 78],
                            85: [2, 78]
                        }, {
                            23: [2, 33],
                            33: [2, 33],
                            54: [2, 33],
                            65: [2, 33],
                            68: [2, 33],
                            72: [2, 33],
                            75: [2, 33],
                            80: [2, 33],
                            81: [2, 33],
                            82: [2, 33],
                            83: [2, 33],
                            84: [2, 33],
                            85: [2, 33]
                        }, {
                            23: [2, 34],
                            33: [2, 34],
                            54: [2, 34],
                            65: [2, 34],
                            68: [2, 34],
                            72: [2, 34],
                            75: [2, 34],
                            80: [2, 34],
                            81: [2, 34],
                            82: [2, 34],
                            83: [2, 34],
                            84: [2, 34],
                            85: [2, 34]
                        }, {
                            23: [2, 35],
                            33: [2, 35],
                            54: [2, 35],
                            65: [2, 35],
                            68: [2, 35],
                            72: [2, 35],
                            75: [2, 35],
                            80: [2, 35],
                            81: [2, 35],
                            82: [2, 35],
                            83: [2, 35],
                            84: [2, 35],
                            85: [2, 35]
                        }, {
                            23: [2, 36],
                            33: [2, 36],
                            54: [2, 36],
                            65: [2, 36],
                            68: [2, 36],
                            72: [2, 36],
                            75: [2, 36],
                            80: [2, 36],
                            81: [2, 36],
                            82: [2, 36],
                            83: [2, 36],
                            84: [2, 36],
                            85: [2, 36]
                        }, {
                            23: [2, 37],
                            33: [2, 37],
                            54: [2, 37],
                            65: [2, 37],
                            68: [2, 37],
                            72: [2, 37],
                            75: [2, 37],
                            80: [2, 37],
                            81: [2, 37],
                            82: [2, 37],
                            83: [2, 37],
                            84: [2, 37],
                            85: [2, 37]
                        }, {
                            23: [2, 38],
                            33: [2, 38],
                            54: [2, 38],
                            65: [2, 38],
                            68: [2, 38],
                            72: [2, 38],
                            75: [2, 38],
                            80: [2, 38],
                            81: [2, 38],
                            82: [2, 38],
                            83: [2, 38],
                            84: [2, 38],
                            85: [2, 38]
                        }, {
                            23: [2, 39],
                            33: [2, 39],
                            54: [2, 39],
                            65: [2, 39],
                            68: [2, 39],
                            72: [2, 39],
                            75: [2, 39],
                            80: [2, 39],
                            81: [2, 39],
                            82: [2, 39],
                            83: [2, 39],
                            84: [2, 39],
                            85: [2, 39]
                        }, {
                            23: [2, 43],
                            33: [2, 43],
                            54: [2, 43],
                            65: [2, 43],
                            68: [2, 43],
                            72: [2, 43],
                            75: [2, 43],
                            80: [2, 43],
                            81: [2, 43],
                            82: [2, 43],
                            83: [2, 43],
                            84: [2, 43],
                            85: [2, 43],
                            87: [1, 51]
                        }, {
                            72: [1, 35],
                            86: 52
                        }, {
                            23: [2, 45],
                            33: [2, 45],
                            54: [2, 45],
                            65: [2, 45],
                            68: [2, 45],
                            72: [2, 45],
                            75: [2, 45],
                            80: [2, 45],
                            81: [2, 45],
                            82: [2, 45],
                            83: [2, 45],
                            84: [2, 45],
                            85: [2, 45],
                            87: [2, 45]
                        }, {
                            52: 53,
                            54: [2, 82],
                            65: [2, 82],
                            72: [2, 82],
                            80: [2, 82],
                            81: [2, 82],
                            82: [2, 82],
                            83: [2, 82],
                            84: [2, 82],
                            85: [2, 82]
                        }, {
                            25: 54,
                            38: 56,
                            39: [1, 58],
                            43: 57,
                            44: [1, 59],
                            45: 55,
                            47: [2, 54]
                        }, {
                            28: 60,
                            43: 61,
                            44: [1, 59],
                            47: [2, 56]
                        }, {
                            13: 63,
                            15: [1, 20],
                            18: [1, 62]
                        }, {
                            15: [2, 48],
                            18: [2, 48]
                        }, {
                            33: [2, 86],
                            57: 64,
                            65: [2, 86],
                            72: [2, 86],
                            80: [2, 86],
                            81: [2, 86],
                            82: [2, 86],
                            83: [2, 86],
                            84: [2, 86],
                            85: [2, 86]
                        }, {
                            33: [2, 40],
                            65: [2, 40],
                            72: [2, 40],
                            80: [2, 40],
                            81: [2, 40],
                            82: [2, 40],
                            83: [2, 40],
                            84: [2, 40],
                            85: [2, 40]
                        }, {
                            33: [2, 41],
                            65: [2, 41],
                            72: [2, 41],
                            80: [2, 41],
                            81: [2, 41],
                            82: [2, 41],
                            83: [2, 41],
                            84: [2, 41],
                            85: [2, 41]
                        }, {
                            20: 65,
                            72: [1, 35],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            26: 66,
                            47: [1, 67]
                        }, {
                            30: 68,
                            33: [2, 58],
                            65: [2, 58],
                            72: [2, 58],
                            75: [2, 58],
                            80: [2, 58],
                            81: [2, 58],
                            82: [2, 58],
                            83: [2, 58],
                            84: [2, 58],
                            85: [2, 58]
                        }, {
                            33: [2, 64],
                            35: 69,
                            65: [2, 64],
                            72: [2, 64],
                            75: [2, 64],
                            80: [2, 64],
                            81: [2, 64],
                            82: [2, 64],
                            83: [2, 64],
                            84: [2, 64],
                            85: [2, 64]
                        }, {
                            21: 70,
                            23: [2, 50],
                            65: [2, 50],
                            72: [2, 50],
                            80: [2, 50],
                            81: [2, 50],
                            82: [2, 50],
                            83: [2, 50],
                            84: [2, 50],
                            85: [2, 50]
                        }, {
                            33: [2, 90],
                            61: 71,
                            65: [2, 90],
                            72: [2, 90],
                            80: [2, 90],
                            81: [2, 90],
                            82: [2, 90],
                            83: [2, 90],
                            84: [2, 90],
                            85: [2, 90]
                        }, {
                            20: 75,
                            33: [2, 80],
                            50: 72,
                            63: 73,
                            64: 76,
                            65: [1, 44],
                            69: 74,
                            70: 77,
                            71: 78,
                            72: [1, 79],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            72: [1, 80]
                        }, {
                            23: [2, 42],
                            33: [2, 42],
                            54: [2, 42],
                            65: [2, 42],
                            68: [2, 42],
                            72: [2, 42],
                            75: [2, 42],
                            80: [2, 42],
                            81: [2, 42],
                            82: [2, 42],
                            83: [2, 42],
                            84: [2, 42],
                            85: [2, 42],
                            87: [1, 51]
                        }, {
                            20: 75,
                            53: 81,
                            54: [2, 84],
                            63: 82,
                            64: 76,
                            65: [1, 44],
                            69: 83,
                            70: 77,
                            71: 78,
                            72: [1, 79],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            26: 84,
                            47: [1, 67]
                        }, {
                            47: [2, 55]
                        }, {
                            4: 85,
                            6: 3,
                            14: [2, 46],
                            15: [2, 46],
                            19: [2, 46],
                            29: [2, 46],
                            34: [2, 46],
                            39: [2, 46],
                            44: [2, 46],
                            47: [2, 46],
                            48: [2, 46],
                            51: [2, 46],
                            55: [2, 46],
                            60: [2, 46]
                        }, {
                            47: [2, 20]
                        }, {
                            20: 86,
                            72: [1, 35],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            4: 87,
                            6: 3,
                            14: [2, 46],
                            15: [2, 46],
                            19: [2, 46],
                            29: [2, 46],
                            34: [2, 46],
                            47: [2, 46],
                            48: [2, 46],
                            51: [2, 46],
                            55: [2, 46],
                            60: [2, 46]
                        }, {
                            26: 88,
                            47: [1, 67]
                        }, {
                            47: [2, 57]
                        }, {
                            5: [2, 11],
                            14: [2, 11],
                            15: [2, 11],
                            19: [2, 11],
                            29: [2, 11],
                            34: [2, 11],
                            39: [2, 11],
                            44: [2, 11],
                            47: [2, 11],
                            48: [2, 11],
                            51: [2, 11],
                            55: [2, 11],
                            60: [2, 11]
                        }, {
                            15: [2, 49],
                            18: [2, 49]
                        }, {
                            20: 75,
                            33: [2, 88],
                            58: 89,
                            63: 90,
                            64: 76,
                            65: [1, 44],
                            69: 91,
                            70: 77,
                            71: 78,
                            72: [1, 79],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            65: [2, 94],
                            66: 92,
                            68: [2, 94],
                            72: [2, 94],
                            80: [2, 94],
                            81: [2, 94],
                            82: [2, 94],
                            83: [2, 94],
                            84: [2, 94],
                            85: [2, 94]
                        }, {
                            5: [2, 25],
                            14: [2, 25],
                            15: [2, 25],
                            19: [2, 25],
                            29: [2, 25],
                            34: [2, 25],
                            39: [2, 25],
                            44: [2, 25],
                            47: [2, 25],
                            48: [2, 25],
                            51: [2, 25],
                            55: [2, 25],
                            60: [2, 25]
                        }, {
                            20: 93,
                            72: [1, 35],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            20: 75,
                            31: 94,
                            33: [2, 60],
                            63: 95,
                            64: 76,
                            65: [1, 44],
                            69: 96,
                            70: 77,
                            71: 78,
                            72: [1, 79],
                            75: [2, 60],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            20: 75,
                            33: [2, 66],
                            36: 97,
                            63: 98,
                            64: 76,
                            65: [1, 44],
                            69: 99,
                            70: 77,
                            71: 78,
                            72: [1, 79],
                            75: [2, 66],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            20: 75,
                            22: 100,
                            23: [2, 52],
                            63: 101,
                            64: 76,
                            65: [1, 44],
                            69: 102,
                            70: 77,
                            71: 78,
                            72: [1, 79],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            20: 75,
                            33: [2, 92],
                            62: 103,
                            63: 104,
                            64: 76,
                            65: [1, 44],
                            69: 105,
                            70: 77,
                            71: 78,
                            72: [1, 79],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            33: [1, 106]
                        }, {
                            33: [2, 79],
                            65: [2, 79],
                            72: [2, 79],
                            80: [2, 79],
                            81: [2, 79],
                            82: [2, 79],
                            83: [2, 79],
                            84: [2, 79],
                            85: [2, 79]
                        }, {
                            33: [2, 81]
                        }, {
                            23: [2, 27],
                            33: [2, 27],
                            54: [2, 27],
                            65: [2, 27],
                            68: [2, 27],
                            72: [2, 27],
                            75: [2, 27],
                            80: [2, 27],
                            81: [2, 27],
                            82: [2, 27],
                            83: [2, 27],
                            84: [2, 27],
                            85: [2, 27]
                        }, {
                            23: [2, 28],
                            33: [2, 28],
                            54: [2, 28],
                            65: [2, 28],
                            68: [2, 28],
                            72: [2, 28],
                            75: [2, 28],
                            80: [2, 28],
                            81: [2, 28],
                            82: [2, 28],
                            83: [2, 28],
                            84: [2, 28],
                            85: [2, 28]
                        }, {
                            23: [2, 30],
                            33: [2, 30],
                            54: [2, 30],
                            68: [2, 30],
                            71: 107,
                            72: [1, 108],
                            75: [2, 30]
                        }, {
                            23: [2, 98],
                            33: [2, 98],
                            54: [2, 98],
                            68: [2, 98],
                            72: [2, 98],
                            75: [2, 98]
                        }, {
                            23: [2, 45],
                            33: [2, 45],
                            54: [2, 45],
                            65: [2, 45],
                            68: [2, 45],
                            72: [2, 45],
                            73: [1, 109],
                            75: [2, 45],
                            80: [2, 45],
                            81: [2, 45],
                            82: [2, 45],
                            83: [2, 45],
                            84: [2, 45],
                            85: [2, 45],
                            87: [2, 45]
                        }, {
                            23: [2, 44],
                            33: [2, 44],
                            54: [2, 44],
                            65: [2, 44],
                            68: [2, 44],
                            72: [2, 44],
                            75: [2, 44],
                            80: [2, 44],
                            81: [2, 44],
                            82: [2, 44],
                            83: [2, 44],
                            84: [2, 44],
                            85: [2, 44],
                            87: [2, 44]
                        }, {
                            54: [1, 110]
                        }, {
                            54: [2, 83],
                            65: [2, 83],
                            72: [2, 83],
                            80: [2, 83],
                            81: [2, 83],
                            82: [2, 83],
                            83: [2, 83],
                            84: [2, 83],
                            85: [2, 83]
                        }, {
                            54: [2, 85]
                        }, {
                            5: [2, 13],
                            14: [2, 13],
                            15: [2, 13],
                            19: [2, 13],
                            29: [2, 13],
                            34: [2, 13],
                            39: [2, 13],
                            44: [2, 13],
                            47: [2, 13],
                            48: [2, 13],
                            51: [2, 13],
                            55: [2, 13],
                            60: [2, 13]
                        }, {
                            38: 56,
                            39: [1, 58],
                            43: 57,
                            44: [1, 59],
                            45: 112,
                            46: 111,
                            47: [2, 76]
                        }, {
                            33: [2, 70],
                            40: 113,
                            65: [2, 70],
                            72: [2, 70],
                            75: [2, 70],
                            80: [2, 70],
                            81: [2, 70],
                            82: [2, 70],
                            83: [2, 70],
                            84: [2, 70],
                            85: [2, 70]
                        }, {
                            47: [2, 18]
                        }, {
                            5: [2, 14],
                            14: [2, 14],
                            15: [2, 14],
                            19: [2, 14],
                            29: [2, 14],
                            34: [2, 14],
                            39: [2, 14],
                            44: [2, 14],
                            47: [2, 14],
                            48: [2, 14],
                            51: [2, 14],
                            55: [2, 14],
                            60: [2, 14]
                        }, {
                            33: [1, 114]
                        }, {
                            33: [2, 87],
                            65: [2, 87],
                            72: [2, 87],
                            80: [2, 87],
                            81: [2, 87],
                            82: [2, 87],
                            83: [2, 87],
                            84: [2, 87],
                            85: [2, 87]
                        }, {
                            33: [2, 89]
                        }, {
                            20: 75,
                            63: 116,
                            64: 76,
                            65: [1, 44],
                            67: 115,
                            68: [2, 96],
                            69: 117,
                            70: 77,
                            71: 78,
                            72: [1, 79],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            33: [1, 118]
                        }, {
                            32: 119,
                            33: [2, 62],
                            74: 120,
                            75: [1, 121]
                        }, {
                            33: [2, 59],
                            65: [2, 59],
                            72: [2, 59],
                            75: [2, 59],
                            80: [2, 59],
                            81: [2, 59],
                            82: [2, 59],
                            83: [2, 59],
                            84: [2, 59],
                            85: [2, 59]
                        }, {
                            33: [2, 61],
                            75: [2, 61]
                        }, {
                            33: [2, 68],
                            37: 122,
                            74: 123,
                            75: [1, 121]
                        }, {
                            33: [2, 65],
                            65: [2, 65],
                            72: [2, 65],
                            75: [2, 65],
                            80: [2, 65],
                            81: [2, 65],
                            82: [2, 65],
                            83: [2, 65],
                            84: [2, 65],
                            85: [2, 65]
                        }, {
                            33: [2, 67],
                            75: [2, 67]
                        }, {
                            23: [1, 124]
                        }, {
                            23: [2, 51],
                            65: [2, 51],
                            72: [2, 51],
                            80: [2, 51],
                            81: [2, 51],
                            82: [2, 51],
                            83: [2, 51],
                            84: [2, 51],
                            85: [2, 51]
                        }, {
                            23: [2, 53]
                        }, {
                            33: [1, 125]
                        }, {
                            33: [2, 91],
                            65: [2, 91],
                            72: [2, 91],
                            80: [2, 91],
                            81: [2, 91],
                            82: [2, 91],
                            83: [2, 91],
                            84: [2, 91],
                            85: [2, 91]
                        }, {
                            33: [2, 93]
                        }, {
                            5: [2, 22],
                            14: [2, 22],
                            15: [2, 22],
                            19: [2, 22],
                            29: [2, 22],
                            34: [2, 22],
                            39: [2, 22],
                            44: [2, 22],
                            47: [2, 22],
                            48: [2, 22],
                            51: [2, 22],
                            55: [2, 22],
                            60: [2, 22]
                        }, {
                            23: [2, 99],
                            33: [2, 99],
                            54: [2, 99],
                            68: [2, 99],
                            72: [2, 99],
                            75: [2, 99]
                        }, {
                            73: [1, 109]
                        }, {
                            20: 75,
                            63: 126,
                            64: 76,
                            65: [1, 44],
                            72: [1, 35],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            5: [2, 23],
                            14: [2, 23],
                            15: [2, 23],
                            19: [2, 23],
                            29: [2, 23],
                            34: [2, 23],
                            39: [2, 23],
                            44: [2, 23],
                            47: [2, 23],
                            48: [2, 23],
                            51: [2, 23],
                            55: [2, 23],
                            60: [2, 23]
                        }, {
                            47: [2, 19]
                        }, {
                            47: [2, 77]
                        }, {
                            20: 75,
                            33: [2, 72],
                            41: 127,
                            63: 128,
                            64: 76,
                            65: [1, 44],
                            69: 129,
                            70: 77,
                            71: 78,
                            72: [1, 79],
                            75: [2, 72],
                            78: 26,
                            79: 27,
                            80: [1, 28],
                            81: [1, 29],
                            82: [1, 30],
                            83: [1, 31],
                            84: [1, 32],
                            85: [1, 34],
                            86: 33
                        }, {
                            5: [2, 24],
                            14: [2, 24],
                            15: [2, 24],
                            19: [2, 24],
                            29: [2, 24],
                            34: [2, 24],
                            39: [2, 24],
                            44: [2, 24],
                            47: [2, 24],
                            48: [2, 24],
                            51: [2, 24],
                            55: [2, 24],
                            60: [2, 24]
                        }, {
                            68: [1, 130]
                        }, {
                            65: [2, 95],
                            68: [2, 95],
                            72: [2, 95],
                            80: [2, 95],
                            81: [2, 95],
                            82: [2, 95],
                            83: [2, 95],
                            84: [2, 95],
                            85: [2, 95]
                        }, {
                            68: [2, 97]
                        }, {
                            5: [2, 21],
                            14: [2, 21],
                            15: [2, 21],
                            19: [2, 21],
                            29: [2, 21],
                            34: [2, 21],
                            39: [2, 21],
                            44: [2, 21],
                            47: [2, 21],
                            48: [2, 21],
                            51: [2, 21],
                            55: [2, 21],
                            60: [2, 21]
                        }, {
                            33: [1, 131]
                        }, {
                            33: [2, 63]
                        }, {
                            72: [1, 133],
                            76: 132
                        }, {
                            33: [1, 134]
                        }, {
                            33: [2, 69]
                        }, {
                            15: [2, 12]
                        }, {
                            14: [2, 26],
                            15: [2, 26],
                            19: [2, 26],
                            29: [2, 26],
                            34: [2, 26],
                            47: [2, 26],
                            48: [2, 26],
                            51: [2, 26],
                            55: [2, 26],
                            60: [2, 26]
                        }, {
                            23: [2, 31],
                            33: [2, 31],
                            54: [2, 31],
                            68: [2, 31],
                            72: [2, 31],
                            75: [2, 31]
                        }, {
                            33: [2, 74],
                            42: 135,
                            74: 136,
                            75: [1, 121]
                        }, {
                            33: [2, 71],
                            65: [2, 71],
                            72: [2, 71],
                            75: [2, 71],
                            80: [2, 71],
                            81: [2, 71],
                            82: [2, 71],
                            83: [2, 71],
                            84: [2, 71],
                            85: [2, 71]
                        }, {
                            33: [2, 73],
                            75: [2, 73]
                        }, {
                            23: [2, 29],
                            33: [2, 29],
                            54: [2, 29],
                            65: [2, 29],
                            68: [2, 29],
                            72: [2, 29],
                            75: [2, 29],
                            80: [2, 29],
                            81: [2, 29],
                            82: [2, 29],
                            83: [2, 29],
                            84: [2, 29],
                            85: [2, 29]
                        }, {
                            14: [2, 15],
                            15: [2, 15],
                            19: [2, 15],
                            29: [2, 15],
                            34: [2, 15],
                            39: [2, 15],
                            44: [2, 15],
                            47: [2, 15],
                            48: [2, 15],
                            51: [2, 15],
                            55: [2, 15],
                            60: [2, 15]
                        }, {
                            72: [1, 138],
                            77: [1, 137]
                        }, {
                            72: [2, 100],
                            77: [2, 100]
                        }, {
                            14: [2, 16],
                            15: [2, 16],
                            19: [2, 16],
                            29: [2, 16],
                            34: [2, 16],
                            44: [2, 16],
                            47: [2, 16],
                            48: [2, 16],
                            51: [2, 16],
                            55: [2, 16],
                            60: [2, 16]
                        }, {
                            33: [1, 139]
                        }, {
                            33: [2, 75]
                        }, {
                            33: [2, 32]
                        }, {
                            72: [2, 101],
                            77: [2, 101]
                        }, {
                            14: [2, 17],
                            15: [2, 17],
                            19: [2, 17],
                            29: [2, 17],
                            34: [2, 17],
                            39: [2, 17],
                            44: [2, 17],
                            47: [2, 17],
                            48: [2, 17],
                            51: [2, 17],
                            55: [2, 17],
                            60: [2, 17]
                        }],
                        defaultActions: {
                            4: [2, 1],
                            55: [2, 55],
                            57: [2, 20],
                            61: [2, 57],
                            74: [2, 81],
                            83: [2, 85],
                            87: [2, 18],
                            91: [2, 89],
                            102: [2, 53],
                            105: [2, 93],
                            111: [2, 19],
                            112: [2, 77],
                            117: [2, 97],
                            120: [2, 63],
                            123: [2, 69],
                            124: [2, 12],
                            136: [2, 75],
                            137: [2, 32]
                        },
                        parseError: function(a, b) {
                            throw new Error(a)
                        },
                        parse: function(a) {
                            function b() {
                                var a;
                                return a = c.lexer.lex() || 1, "number" != typeof a && (a = c.symbols_[a] || a), a
                            }
                            var c = this,
                                d = [0],
                                e = [null],
                                f = [],
                                g = this.table,
                                h = "",
                                i = 0,
                                j = 0,
                                k = 0;
                            this.lexer.setInput(a), this.lexer.yy = this.yy, this.yy.lexer = this.lexer, this.yy.parser = this, "undefined" == typeof this.lexer.yylloc && (this.lexer.yylloc = {});
                            var l = this.lexer.yylloc;
                            f.push(l);
                            var m = this.lexer.options && this.lexer.options.ranges;
                            "function" == typeof this.yy.parseError && (this.parseError = this.yy.parseError);
                            for (var n, o, p, q, r, s, t, u, v, w = {};;) {
                                if (p = d[d.length - 1], this.defaultActions[p] ? q = this.defaultActions[p] : ((null === n || "undefined" == typeof n) && (n = b()), q = g[p] && g[p][n]), "undefined" == typeof q || !q.length || !q[0]) {
                                    var x = "";
                                    if (!k) {
                                        v = [];
                                        for (s in g[p]) this.terminals_[s] && s > 2 && v.push("'" + this.terminals_[s] + "'");
                                        x = this.lexer.showPosition ? "Parse error on line " + (i + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + v.join(", ") + ", got '" + (this.terminals_[n] || n) + "'" : "Parse error on line " + (i + 1) + ": Unexpected " + (1 == n ? "end of input" : "'" + (this.terminals_[n] || n) + "'"), this.parseError(x, {
                                            text: this.lexer.match,
                                            token: this.terminals_[n] || n,
                                            line: this.lexer.yylineno,
                                            loc: l,
                                            expected: v
                                        })
                                    }
                                }
                                if (q[0] instanceof Array && q.length > 1) throw new Error("Parse Error: multiple actions possible at state: " + p + ", token: " + n);
                                switch (q[0]) {
                                    case 1:
                                        d.push(n), e.push(this.lexer.yytext), f.push(this.lexer.yylloc), d.push(q[1]), n = null, o ? (n = o, o = null) : (j = this.lexer.yyleng, h = this.lexer.yytext, i = this.lexer.yylineno, l = this.lexer.yylloc, k > 0 && k--);
                                        break;
                                    case 2:
                                        if (t = this.productions_[q[1]][1], w.$ = e[e.length - t], w._$ = {
                                                first_line: f[f.length - (t || 1)].first_line,
                                                last_line: f[f.length - 1].last_line,
                                                first_column: f[f.length - (t || 1)].first_column,
                                                last_column: f[f.length - 1].last_column
                                            }, m && (w._$.range = [f[f.length - (t || 1)].range[0], f[f.length - 1].range[1]]), r = this.performAction.call(w, h, j, i, this.yy, q[1], e, f), "undefined" != typeof r) return r;
                                        t && (d = d.slice(0, -1 * t * 2), e = e.slice(0, -1 * t), f = f.slice(0, -1 * t)), d.push(this.productions_[q[1]][0]), e.push(w.$), f.push(w._$), u = g[d[d.length - 2]][d[d.length - 1]], d.push(u);
                                        break;
                                    case 3:
                                        return !0
                                }
                            }
                            return !0
                        }
                    },
                    c = function() {
                        var a = {
                            EOF: 1,
                            parseError: function(a, b) {
                                if (!this.yy.parser) throw new Error(a);
                                this.yy.parser.parseError(a, b)
                            },
                            setInput: function(a) {
                                return this._input = a, this._more = this._less = this.done = !1, this.yylineno = this.yyleng = 0, this.yytext = this.matched = this.match = "", this.conditionStack = ["INITIAL"], this.yylloc = {
                                    first_line: 1,
                                    first_column: 0,
                                    last_line: 1,
                                    last_column: 0
                                }, this.options.ranges && (this.yylloc.range = [0, 0]), this.offset = 0, this
                            },
                            input: function() {
                                var a = this._input[0];
                                this.yytext += a, this.yyleng++, this.offset++, this.match += a, this.matched += a;
                                var b = a.match(/(?:\r\n?|\n).*/g);
                                return b ? (this.yylineno++, this.yylloc.last_line++) : this.yylloc.last_column++, this.options.ranges && this.yylloc.range[1]++, this._input = this._input.slice(1), a
                            },
                            unput: function(a) {
                                var b = a.length,
                                    c = a.split(/(?:\r\n?|\n)/g);
                                this._input = a + this._input, this.yytext = this.yytext.substr(0, this.yytext.length - b - 1), this.offset -= b;
                                var d = this.match.split(/(?:\r\n?|\n)/g);
                                this.match = this.match.substr(0, this.match.length - 1), this.matched = this.matched.substr(0, this.matched.length - 1), c.length - 1 && (this.yylineno -= c.length - 1);
                                var e = this.yylloc.range;
                                return this.yylloc = {
                                    first_line: this.yylloc.first_line,
                                    last_line: this.yylineno + 1,
                                    first_column: this.yylloc.first_column,
                                    last_column: c ? (c.length === d.length ? this.yylloc.first_column : 0) + d[d.length - c.length].length - c[0].length : this.yylloc.first_column - b
                                }, this.options.ranges && (this.yylloc.range = [e[0], e[0] + this.yyleng - b]), this
                            },
                            more: function() {
                                return this._more = !0, this
                            },
                            less: function(a) {
                                this.unput(this.match.slice(a))
                            },
                            pastInput: function() {
                                var a = this.matched.substr(0, this.matched.length - this.match.length);
                                return (a.length > 20 ? "..." : "") + a.substr(-20).replace(/\n/g, "")
                            },
                            upcomingInput: function() {
                                var a = this.match;
                                return a.length < 20 && (a += this._input.substr(0, 20 - a.length)), (a.substr(0, 20) + (a.length > 20 ? "..." : "")).replace(/\n/g, "")
                            },
                            showPosition: function() {
                                var a = this.pastInput(),
                                    b = new Array(a.length + 1).join("-");
                                return a + this.upcomingInput() + "\n" + b + "^"
                            },
                            next: function() {
                                if (this.done) return this.EOF;
                                this._input || (this.done = !0);
                                var a, b, c, d, e;
                                this._more || (this.yytext = "", this.match = "");
                                for (var f = this._currentRules(), g = 0; g < f.length && (c = this._input.match(this.rules[f[g]]), !c || b && !(c[0].length > b[0].length) || (b = c, d = g, this.options.flex)); g++);
                                return b ? (e = b[0].match(/(?:\r\n?|\n).*/g), e && (this.yylineno += e.length), this.yylloc = {
                                    first_line: this.yylloc.last_line,
                                    last_line: this.yylineno + 1,
                                    first_column: this.yylloc.last_column,
                                    last_column: e ? e[e.length - 1].length - e[e.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + b[0].length
                                }, this.yytext += b[0], this.match += b[0], this.matches = b, this.yyleng = this.yytext.length, this.options.ranges && (this.yylloc.range = [this.offset, this.offset += this.yyleng]), this._more = !1, this._input = this._input.slice(b[0].length), this.matched += b[0], a = this.performAction.call(this, this.yy, this, f[d], this.conditionStack[this.conditionStack.length - 1]), this.done && this._input && (this.done = !1), a ? a : void 0) : "" === this._input ? this.EOF : this.parseError("Lexical error on line " + (this.yylineno + 1) + ". Unrecognized text.\n" + this.showPosition(), {
                                    text: "",
                                    token: null,
                                    line: this.yylineno
                                })
                            },
                            lex: function() {
                                var a = this.next();
                                return "undefined" != typeof a ? a : this.lex()
                            },
                            begin: function(a) {
                                this.conditionStack.push(a)
                            },
                            popState: function() {
                                return this.conditionStack.pop()
                            },
                            _currentRules: function() {
                                return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules
                            },
                            topState: function() {
                                return this.conditionStack[this.conditionStack.length - 2]
                            },
                            pushState: function(a) {
                                this.begin(a)
                            }
                        };
                        return a.options = {}, a.performAction = function(a, b, c, d) {
                            function e(a, c) {
                                return b.yytext = b.yytext.substr(a, b.yyleng - c)
                            }
                            switch (c) {
                                case 0:
                                    if ("\\\\" === b.yytext.slice(-2) ? (e(0, 1), this.begin("mu")) : "\\" === b.yytext.slice(-1) ? (e(0, 1), this.begin("emu")) : this.begin("mu"), b.yytext) return 15;
                                    break;
                                case 1:
                                    return 15;
                                case 2:
                                    return this.popState(), 15;
                                case 3:
                                    return this.begin("raw"), 15;
                                case 4:
                                    return this.popState(), "raw" === this.conditionStack[this.conditionStack.length - 1] ? 15 : (b.yytext = b.yytext.substr(5, b.yyleng - 9), "END_RAW_BLOCK");
                                case 5:
                                    return 15;
                                case 6:
                                    return this.popState(), 14;
                                case 7:
                                    return 65;
                                case 8:
                                    return 68;
                                case 9:
                                    return 19;
                                case 10:
                                    return this.popState(), this.begin("raw"), 23;
                                case 11:
                                    return 55;
                                case 12:
                                    return 60;
                                case 13:
                                    return 29;
                                case 14:
                                    return 47;
                                case 15:
                                    return this.popState(), 44;
                                case 16:
                                    return this.popState(), 44;
                                case 17:
                                    return 34;
                                case 18:
                                    return 39;
                                case 19:
                                    return 51;
                                case 20:
                                    return 48;
                                case 21:
                                    this.unput(b.yytext), this.popState(), this.begin("com");
                                    break;
                                case 22:
                                    return this.popState(), 14;
                                case 23:
                                    return 48;
                                case 24:
                                    return 73;
                                case 25:
                                    return 72;
                                case 26:
                                    return 72;
                                case 27:
                                    return 87;
                                case 28:
                                    break;
                                case 29:
                                    return this.popState(), 54;
                                case 30:
                                    return this.popState(), 33;
                                case 31:
                                    return b.yytext = e(1, 2).replace(/\\"/g, '"'), 80;
                                case 32:
                                    return b.yytext = e(1, 2).replace(/\\'/g, "'"), 80;
                                case 33:
                                    return 85;
                                case 34:
                                    return 82;
                                case 35:
                                    return 82;
                                case 36:
                                    return 83;
                                case 37:
                                    return 84;
                                case 38:
                                    return 81;
                                case 39:
                                    return 75;
                                case 40:
                                    return 77;
                                case 41:
                                    return 72;
                                case 42:
                                    return b.yytext = b.yytext.replace(/\\([\\\]])/g, "$1"), 72;
                                case 43:
                                    return "INVALID";
                                case 44:
                                    return 5
                            }
                        }, a.rules = [/^(?:[^\x00]*?(?=(\{\{)))/, /^(?:[^\x00]+)/, /^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/, /^(?:\{\{\{\{(?=[^/]))/, /^(?:\{\{\{\{\/[^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=[=}\s\/.])\}\}\}\})/, /^(?:[^\x00]*?(?=(\{\{\{\{)))/, /^(?:[\s\S]*?--(~)?\}\})/, /^(?:\()/, /^(?:\))/, /^(?:\{\{\{\{)/, /^(?:\}\}\}\})/, /^(?:\{\{(~)?>)/, /^(?:\{\{(~)?#>)/, /^(?:\{\{(~)?#\*?)/, /^(?:\{\{(~)?\/)/, /^(?:\{\{(~)?\^\s*(~)?\}\})/, /^(?:\{\{(~)?\s*else\s*(~)?\}\})/, /^(?:\{\{(~)?\^)/, /^(?:\{\{(~)?\s*else\b)/, /^(?:\{\{(~)?\{)/, /^(?:\{\{(~)?&)/, /^(?:\{\{(~)?!--)/, /^(?:\{\{(~)?![\s\S]*?\}\})/, /^(?:\{\{(~)?\*?)/, /^(?:=)/, /^(?:\.\.)/, /^(?:\.(?=([=~}\s\/.)|])))/, /^(?:[\/.])/, /^(?:\s+)/, /^(?:\}(~)?\}\})/, /^(?:(~)?\}\})/, /^(?:"(\\["]|[^"])*")/, /^(?:'(\\[']|[^'])*')/, /^(?:@)/, /^(?:true(?=([~}\s)])))/, /^(?:false(?=([~}\s)])))/, /^(?:undefined(?=([~}\s)])))/, /^(?:null(?=([~}\s)])))/, /^(?:-?[0-9]+(?:\.[0-9]+)?(?=([~}\s)])))/, /^(?:as\s+\|)/, /^(?:\|)/, /^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)|]))))/, /^(?:\[(\\\]|[^\]])*\])/, /^(?:.)/, /^(?:$)/], a.conditions = {
                            mu: {
                                rules: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44],
                                inclusive: !1
                            },
                            emu: {
                                rules: [2],
                                inclusive: !1
                            },
                            com: {
                                rules: [6],
                                inclusive: !1
                            },
                            raw: {
                                rules: [3, 4, 5],
                                inclusive: !1
                            },
                            INITIAL: {
                                rules: [0, 1, 44],
                                inclusive: !0
                            }
                        }, a
                    }();
                return b.lexer = c, a.prototype = b, b.Parser = a, new a
            }();
            b.__esModule = !0, b["default"] = c
        }, function(a, b, c) {
            "use strict";

            function d() {
                var a = arguments.length <= 0 || void 0 === arguments[0] ? {} : arguments[0];
                this.options = a
            }

            function e(a, b, c) {
                void 0 === b && (b = a.length);
                var d = a[b - 1],
                    e = a[b - 2];
                return d ? "ContentStatement" === d.type ? (e || !c ? /\r?\n\s*?$/ : /(^|\r?\n)\s*?$/).test(d.original) : void 0 : c
            }

            function f(a, b, c) {
                void 0 === b && (b = -1);
                var d = a[b + 1],
                    e = a[b + 2];
                return d ? "ContentStatement" === d.type ? (e || !c ? /^\s*?\r?\n/ : /^\s*?(\r?\n|$)/).test(d.original) : void 0 : c
            }

            function g(a, b, c) {
                var d = a[null == b ? 0 : b + 1];
                if (d && "ContentStatement" === d.type && (c || !d.rightStripped)) {
                    var e = d.value;
                    d.value = d.value.replace(c ? /^\s+/ : /^[ \t]*\r?\n?/, ""), d.rightStripped = d.value !== e
                }
            }

            function h(a, b, c) {
                var d = a[null == b ? a.length - 1 : b - 1];
                if (d && "ContentStatement" === d.type && (c || !d.leftStripped)) {
                    var e = d.value;
                    return d.value = d.value.replace(c ? /\s+$/ : /[ \t]+$/, ""), d.leftStripped = d.value !== e, d.leftStripped
                }
            }
            var i = c(1)["default"];
            b.__esModule = !0;
            var j = c(25),
                k = i(j);
            d.prototype = new k["default"], d.prototype.Program = function(a) {
                var b = !this.options.ignoreStandalone,
                    c = !this.isRootSeen;
                this.isRootSeen = !0;
                for (var d = a.body, i = 0, j = d.length; j > i; i++) {
                    var k = d[i],
                        l = this.accept(k);
                    if (l) {
                        var m = e(d, i, c),
                            n = f(d, i, c),
                            o = l.openStandalone && m,
                            p = l.closeStandalone && n,
                            q = l.inlineStandalone && m && n;
                        l.close && g(d, i, !0), l.open && h(d, i, !0), b && q && (g(d, i), h(d, i) && "PartialStatement" === k.type && (k.indent = /([ \t]+$)/.exec(d[i - 1].original)[1])), b && o && (g((k.program || k.inverse).body), h(d, i)), b && p && (g(d, i), h((k.inverse || k.program).body))
                    }
                }
                return a
            }, d.prototype.BlockStatement = d.prototype.DecoratorBlock = d.prototype.PartialBlockStatement = function(a) {
                this.accept(a.program), this.accept(a.inverse);
                var b = a.program || a.inverse,
                    c = a.program && a.inverse,
                    d = c,
                    i = c;
                if (c && c.chained)
                    for (d = c.body[0].program; i.chained;) i = i.body[i.body.length - 1].program;
                var j = {
                    open: a.openStrip.open,
                    close: a.closeStrip.close,
                    openStandalone: f(b.body),
                    closeStandalone: e((d || b).body)
                };
                if (a.openStrip.close && g(b.body, null, !0), c) {
                    var k = a.inverseStrip;
                    k.open && h(b.body, null, !0), k.close && g(d.body, null, !0), a.closeStrip.open && h(i.body, null, !0), !this.options.ignoreStandalone && e(b.body) && f(d.body) && (h(b.body), g(d.body))
                } else a.closeStrip.open && h(b.body, null, !0);
                return j
            }, d.prototype.Decorator = d.prototype.MustacheStatement = function(a) {
                return a.strip
            }, d.prototype.PartialStatement = d.prototype.CommentStatement = function(a) {
                var b = a.strip || {};
                return {
                    inlineStandalone: !0,
                    open: b.open,
                    close: b.close
                }
            }, b["default"] = d, a.exports = b["default"]
        }, function(a, b, c) {
            "use strict";

            function d() {
                this.parents = []
            }

            function e(a) {
                this.acceptRequired(a, "path"), this.acceptArray(a.params), this.acceptKey(a, "hash")
            }

            function f(a) {
                e.call(this, a), this.acceptKey(a, "program"), this.acceptKey(a, "inverse")
            }

            function g(a) {
                this.acceptRequired(a, "name"), this.acceptArray(a.params), this.acceptKey(a, "hash")
            }
            var h = c(1)["default"];
            b.__esModule = !0;
            var i = c(6),
                j = h(i);
            d.prototype = {
                constructor: d,
                mutating: !1,
                acceptKey: function(a, b) {
                    var c = this.accept(a[b]);
                    if (this.mutating) {
                        if (c && !d.prototype[c.type]) throw new j["default"]('Unexpected node type "' + c.type + '" found when accepting ' + b + " on " + a.type);
                        a[b] = c
                    }
                },
                acceptRequired: function(a, b) {
                    if (this.acceptKey(a, b), !a[b]) throw new j["default"](a.type + " requires " + b)
                },
                acceptArray: function(a) {
                    for (var b = 0, c = a.length; c > b; b++) this.acceptKey(a, b), a[b] || (a.splice(b, 1), b--, c--)
                },
                accept: function(a) {
                    if (a) {
                        if (!this[a.type]) throw new j["default"]("Unknown type: " + a.type, a);
                        this.current && this.parents.unshift(this.current), this.current = a;
                        var b = this[a.type](a);
                        return this.current = this.parents.shift(), !this.mutating || b ? b : b !== !1 ? a : void 0
                    }
                },
                Program: function(a) {
                    this.acceptArray(a.body)
                },
                MustacheStatement: e,
                Decorator: e,
                BlockStatement: f,
                DecoratorBlock: f,
                PartialStatement: g,
                PartialBlockStatement: function(a) {
                    g.call(this, a), this.acceptKey(a, "program")
                },
                ContentStatement: function() {},
                CommentStatement: function() {},
                SubExpression: e,
                PathExpression: function() {},
                StringLiteral: function() {},
                NumberLiteral: function() {},
                BooleanLiteral: function() {},
                UndefinedLiteral: function() {},
                NullLiteral: function() {},
                Hash: function(a) {
                    this.acceptArray(a.pairs)
                },
                HashPair: function(a) {
                    this.acceptRequired(a, "value")
                }
            }, b["default"] = d, a.exports = b["default"]
        }, function(a, b, c) {
            "use strict";

            function d(a, b) {
                if (b = b.path ? b.path.original : b, a.path.original !== b) {
                    var c = {
                        loc: a.path.loc
                    };
                    throw new q["default"](a.path.original + " doesn't match " + b, c)
                }
            }

            function e(a, b) {
                this.source = a, this.start = {
                    line: b.first_line,
                    column: b.first_column
                }, this.end = {
                    line: b.last_line,
                    column: b.last_column
                }
            }

            function f(a) {
                return /^\[.*\]$/.test(a) ? a.substr(1, a.length - 2) : a
            }

            function g(a, b) {
                return {
                    open: "~" === a.charAt(2),
                    close: "~" === b.charAt(b.length - 3)
                }
            }

            function h(a) {
                return a.replace(/^\{\{~?\!-?-?/, "").replace(/-?-?~?\}\}$/, "")
            }

            function i(a, b, c) {
                c = this.locInfo(c);
                for (var d = a ? "@" : "", e = [], f = 0, g = "", h = 0, i = b.length; i > h; h++) {
                    var j = b[h].part,
                        k = b[h].original !== j;
                    if (d += (b[h].separator || "") + j, k || ".." !== j && "." !== j && "this" !== j) e.push(j);
                    else {
                        if (e.length > 0) throw new q["default"]("Invalid path: " + d, {
                            loc: c
                        });
                        ".." === j && (f++, g += "../")
                    }
                }
                return {
                    type: "PathExpression",
                    data: a,
                    depth: f,
                    parts: e,
                    original: d,
                    loc: c
                }
            }

            function j(a, b, c, d, e, f) {
                var g = d.charAt(3) || d.charAt(2),
                    h = "{" !== g && "&" !== g,
                    i = /\*/.test(d);
                return {
                    type: i ? "Decorator" : "MustacheStatement",
                    path: a,
                    params: b,
                    hash: c,
                    escaped: h,
                    strip: e,
                    loc: this.locInfo(f)
                }
            }

            function k(a, b, c, e) {
                d(a, c), e = this.locInfo(e);
                var f = {
                    type: "Program",
                    body: b,
                    strip: {},
                    loc: e
                };
                return {
                    type: "BlockStatement",
                    path: a.path,
                    params: a.params,
                    hash: a.hash,
                    program: f,
                    openStrip: {},
                    inverseStrip: {},
                    closeStrip: {},
                    loc: e
                }
            }

            function l(a, b, c, e, f, g) {
                e && e.path && d(a, e);
                var h = /\*/.test(a.open);
                b.blockParams = a.blockParams;
                var i = void 0,
                    j = void 0;
                if (c) {
                    if (h) throw new q["default"]("Unexpected inverse block on decorator", c);
                    c.chain && (c.program.body[0].closeStrip = e.strip), j = c.strip, i = c.program
                }
                return f && (f = i, i = b, b = f), {
                    type: h ? "DecoratorBlock" : "BlockStatement",
                    path: a.path,
                    params: a.params,
                    hash: a.hash,
                    program: b,
                    inverse: i,
                    openStrip: a.strip,
                    inverseStrip: j,
                    closeStrip: e && e.strip,
                    loc: this.locInfo(g)
                }
            }

            function m(a, b) {
                if (!b && a.length) {
                    var c = a[0].loc,
                        d = a[a.length - 1].loc;
                    c && d && (b = {
                        source: c.source,
                        start: {
                            line: c.start.line,
                            column: c.start.column
                        },
                        end: {
                            line: d.end.line,
                            column: d.end.column
                        }
                    })
                }
                return {
                    type: "Program",
                    body: a,
                    strip: {},
                    loc: b
                }
            }

            function n(a, b, c, e) {
                return d(a, c), {
                    type: "PartialBlockStatement",
                    name: a.path,
                    params: a.params,
                    hash: a.hash,
                    program: b,
                    openStrip: a.strip,
                    closeStrip: c && c.strip,
                    loc: this.locInfo(e)
                }
            }
            var o = c(1)["default"];
            b.__esModule = !0, b.SourceLocation = e, b.id = f, b.stripFlags = g, b.stripComment = h, b.preparePath = i, b.prepareMustache = j, b.prepareRawBlock = k, b.prepareBlock = l, b.prepareProgram = m, b.preparePartialBlock = n;
            var p = c(6),
                q = o(p)
        }, function(a, b, c) {
            "use strict";

            function d() {}

            function e(a, b, c) {
                if (null == a || "string" != typeof a && "Program" !== a.type) throw new k["default"]("You must pass a string or Handlebars AST to Handlebars.precompile. You passed " + a);
                b = b || {}, "data" in b || (b.data = !0), b.compat && (b.useDepths = !0);
                var d = c.parse(a, b),
                    e = (new c.Compiler).compile(d, b);
                return (new c.JavaScriptCompiler).compile(e, b)
            }

            function f(a, b, c) {
                function d() {
                    var d = c.parse(a, b),
                        e = (new c.Compiler).compile(d, b),
                        f = (new c.JavaScriptCompiler).compile(e, b, void 0, !0);
                    return c.template(f)
                }

                function e(a, b) {
                    return f || (f = d()), f.call(this, a, b)
                }
                if (void 0 === b && (b = {}), null == a || "string" != typeof a && "Program" !== a.type) throw new k["default"]("You must pass a string or Handlebars AST to Handlebars.compile. You passed " + a);
                "data" in b || (b.data = !0), b.compat && (b.useDepths = !0);
                var f = void 0;
                return e._setup = function(a) {
                    return f || (f = d()), f._setup(a)
                }, e._child = function(a, b, c, e) {
                    return f || (f = d()), f._child(a, b, c, e)
                }, e
            }

            function g(a, b) {
                if (a === b) return !0;
                if (l.isArray(a) && l.isArray(b) && a.length === b.length) {
                    for (var c = 0; c < a.length; c++)
                        if (!g(a[c], b[c])) return !1;
                    return !0
                }
            }

            function h(a) {
                if (!a.path.parts) {
                    var b = a.path;
                    a.path = {
                        type: "PathExpression",
                        data: !1,
                        depth: 0,
                        parts: [b.original + ""],
                        original: b.original + "",
                        loc: b.loc
                    }
                }
            }
            var i = c(1)["default"];
            b.__esModule = !0, b.Compiler = d, b.precompile = e, b.compile = f;
            var j = c(6),
                k = i(j),
                l = c(5),
                m = c(21),
                n = i(m),
                o = [].slice;
            d.prototype = {
                compiler: d,
                equals: function(a) {
                    var b = this.opcodes.length;
                    if (a.opcodes.length !== b) return !1;
                    for (var c = 0; b > c; c++) {
                        var d = this.opcodes[c],
                            e = a.opcodes[c];
                        if (d.opcode !== e.opcode || !g(d.args, e.args)) return !1
                    }
                    b = this.children.length;
                    for (var c = 0; b > c; c++)
                        if (!this.children[c].equals(a.children[c])) return !1;
                    return !0
                },
                guid: 0,
                compile: function(a, b) {
                    this.sourceNode = [], this.opcodes = [], this.children = [], this.options = b, this.stringParams = b.stringParams, this.trackIds = b.trackIds, b.blockParams = b.blockParams || [];
                    var c = b.knownHelpers;
                    if (b.knownHelpers = {
                            helperMissing: !0,
                            blockHelperMissing: !0,
                            each: !0,
                            "if": !0,
                            unless: !0,
                            "with": !0,
                            log: !0,
                            lookup: !0
                        }, c)
                        for (var d in c) d in c && (b.knownHelpers[d] = c[d]);
                    return this.accept(a)
                },
                compileProgram: function(a) {
                    var b = new this.compiler,
                        c = b.compile(a, this.options),
                        d = this.guid++;
                    return this.usePartial = this.usePartial || c.usePartial, this.children[d] = c, this.useDepths = this.useDepths || c.useDepths, d
                },
                accept: function(a) {
                    if (!this[a.type]) throw new k["default"]("Unknown type: " + a.type, a);
                    this.sourceNode.unshift(a);
                    var b = this[a.type](a);
                    return this.sourceNode.shift(), b
                },
                Program: function(a) {
                    this.options.blockParams.unshift(a.blockParams);
                    for (var b = a.body, c = b.length, d = 0; c > d; d++) this.accept(b[d]);
                    return this.options.blockParams.shift(), this.isSimple = 1 === c, this.blockParams = a.blockParams ? a.blockParams.length : 0, this
                },
                BlockStatement: function(a) {
                    h(a);
                    var b = a.program,
                        c = a.inverse;
                    b = b && this.compileProgram(b), c = c && this.compileProgram(c);
                    var d = this.classifySexpr(a);
                    "helper" === d ? this.helperSexpr(a, b, c) : "simple" === d ? (this.simpleSexpr(a), this.opcode("pushProgram", b), this.opcode("pushProgram", c), this.opcode("emptyHash"), this.opcode("blockValue", a.path.original)) : (this.ambiguousSexpr(a, b, c), this.opcode("pushProgram", b), this.opcode("pushProgram", c), this.opcode("emptyHash"), this.opcode("ambiguousBlockValue")), this.opcode("append")
                },
                DecoratorBlock: function(a) {
                    var b = a.program && this.compileProgram(a.program),
                        c = this.setupFullMustacheParams(a, b, void 0),
                        d = a.path;
                    this.useDecorators = !0, this.opcode("registerDecorator", c.length, d.original)
                },
                PartialStatement: function(a) {
                    this.usePartial = !0;
                    var b = a.program;
                    b && (b = this.compileProgram(a.program));
                    var c = a.params;
                    if (c.length > 1) throw new k["default"]("Unsupported number of partial arguments: " + c.length, a);
                    c.length || (this.options.explicitPartialContext ? this.opcode("pushLiteral", "undefined") : c.push({
                        type: "PathExpression",
                        parts: [],
                        depth: 0
                    }));
                    var d = a.name.original,
                        e = "SubExpression" === a.name.type;
                    e && this.accept(a.name), this.setupFullMustacheParams(a, b, void 0, !0);
                    var f = a.indent || "";
                    this.options.preventIndent && f && (this.opcode("appendContent", f), f = ""), this.opcode("invokePartial", e, d, f), this.opcode("append")
                },
                PartialBlockStatement: function(a) {
                    this.PartialStatement(a)
                },
                MustacheStatement: function(a) {
                    this.SubExpression(a), a.escaped && !this.options.noEscape ? this.opcode("appendEscaped") : this.opcode("append")
                },
                Decorator: function(a) {
                    this.DecoratorBlock(a)
                },
                ContentStatement: function(a) {
                    a.value && this.opcode("appendContent", a.value)
                },
                CommentStatement: function() {},
                SubExpression: function(a) {
                    h(a);
                    var b = this.classifySexpr(a);
                    "simple" === b ? this.simpleSexpr(a) : "helper" === b ? this.helperSexpr(a) : this.ambiguousSexpr(a)
                },
                ambiguousSexpr: function(a, b, c) {
                    var d = a.path,
                        e = d.parts[0],
                        f = null != b || null != c;
                    this.opcode("getContext", d.depth), this.opcode("pushProgram", b), this.opcode("pushProgram", c), d.strict = !0, this.accept(d), this.opcode("invokeAmbiguous", e, f)
                },
                simpleSexpr: function(a) {
                    var b = a.path;
                    b.strict = !0, this.accept(b), this.opcode("resolvePossibleLambda")
                },
                helperSexpr: function(a, b, c) {
                    var d = this.setupFullMustacheParams(a, b, c),
                        e = a.path,
                        f = e.parts[0];
                    if (this.options.knownHelpers[f]) this.opcode("invokeKnownHelper", d.length, f);
                    else {
                        if (this.options.knownHelpersOnly) throw new k["default"]("You specified knownHelpersOnly, but used the unknown helper " + f, a);
                        e.strict = !0, e.falsy = !0, this.accept(e), this.opcode("invokeHelper", d.length, e.original, n["default"].helpers.simpleId(e))
                    }
                },
                PathExpression: function(a) {
                    this.addDepth(a.depth), this.opcode("getContext", a.depth);
                    var b = a.parts[0],
                        c = n["default"].helpers.scopedId(a),
                        d = !a.depth && !c && this.blockParamIndex(b);
                    d ? this.opcode("lookupBlockParam", d, a.parts) : b ? a.data ? (this.options.data = !0, this.opcode("lookupData", a.depth, a.parts, a.strict)) : this.opcode("lookupOnContext", a.parts, a.falsy, a.strict, c) : this.opcode("pushContext")
                },
                StringLiteral: function(a) {
                    this.opcode("pushString", a.value)
                },
                NumberLiteral: function(a) {
                    this.opcode("pushLiteral", a.value)
                },
                BooleanLiteral: function(a) {
                    this.opcode("pushLiteral", a.value)
                },
                UndefinedLiteral: function() {
                    this.opcode("pushLiteral", "undefined")
                },
                NullLiteral: function() {
                    this.opcode("pushLiteral", "null")
                },
                Hash: function(a) {
                    var b = a.pairs,
                        c = 0,
                        d = b.length;
                    for (this.opcode("pushHash"); d > c; c++) this.pushParam(b[c].value);
                    for (; c--;) this.opcode("assignToHash", b[c].key);
                    this.opcode("popHash")
                },
                opcode: function(a) {
                    this.opcodes.push({
                        opcode: a,
                        args: o.call(arguments, 1),
                        loc: this.sourceNode[0].loc
                    })
                },
                addDepth: function(a) {
                    a && (this.useDepths = !0)
                },
                classifySexpr: function(a) {
                    var b = n["default"].helpers.simpleId(a.path),
                        c = b && !!this.blockParamIndex(a.path.parts[0]),
                        d = !c && n["default"].helpers.helperExpression(a),
                        e = !c && (d || b);
                    if (e && !d) {
                        var f = a.path.parts[0],
                            g = this.options;
                        g.knownHelpers[f] ? d = !0 : g.knownHelpersOnly && (e = !1)
                    }
                    return d ? "helper" : e ? "ambiguous" : "simple"
                },
                pushParams: function(a) {
                    for (var b = 0, c = a.length; c > b; b++) this.pushParam(a[b])
                },
                pushParam: function(a) {
                    var b = null != a.value ? a.value : a.original || "";
                    if (this.stringParams) b.replace && (b = b.replace(/^(\.?\.\/)*/g, "").replace(/\//g, ".")), a.depth && this.addDepth(a.depth), this.opcode("getContext", a.depth || 0), this.opcode("pushStringParam", b, a.type), "SubExpression" === a.type && this.accept(a);
                    else {
                        if (this.trackIds) {
                            var c = void 0;
                            if (!a.parts || n["default"].helpers.scopedId(a) || a.depth || (c = this.blockParamIndex(a.parts[0])), c) {
                                var d = a.parts.slice(1).join(".");
                                this.opcode("pushId", "BlockParam", c, d)
                            } else b = a.original || b, b.replace && (b = b.replace(/^this(?:\.|$)/, "").replace(/^\.\//, "").replace(/^\.$/, "")), this.opcode("pushId", a.type, b)
                        }
                        this.accept(a)
                    }
                },
                setupFullMustacheParams: function(a, b, c, d) {
                    var e = a.params;
                    return this.pushParams(e), this.opcode("pushProgram", b), this.opcode("pushProgram", c), a.hash ? this.accept(a.hash) : this.opcode("emptyHash", d), e
                },
                blockParamIndex: function(a) {
                    for (var b = 0, c = this.options.blockParams.length; c > b; b++) {
                        var d = this.options.blockParams[b],
                            e = d && l.indexOf(d, a);
                        if (d && e >= 0) return [b, e]
                    }
                }
            }
        }, function(a, b, c) {
            "use strict";

            function d(a) {
                this.value = a
            }

            function e() {}

            function f(a, b, c, d) {
                var e = b.popStack(),
                    f = 0,
                    g = c.length;
                for (a && g--; g > f; f++) e = b.nameLookup(e, c[f], d);
                return a ? [b.aliasable("container.strict"), "(", e, ", ", b.quotedString(c[f]), ")"] : e
            }
            var g = c(1)["default"];
            b.__esModule = !0;
            var h = c(4),
                i = c(6),
                j = g(i),
                k = c(5),
                l = c(29),
                m = g(l);
            e.prototype = {
                    nameLookup: function(a, b) {
                        return e.isValidJavaScriptVariableName(b) ? [a, ".", b] : [a, "[", JSON.stringify(b), "]"]
                    },
                    depthedLookup: function(a) {
                        return [this.aliasable("container.lookup"), '(depths, "', a, '")']
                    },
                    compilerInfo: function() {
                        var a = h.COMPILER_REVISION,
                            b = h.REVISION_CHANGES[a];
                        return [a, b]
                    },
                    appendToBuffer: function(a, b, c) {
                        return k.isArray(a) || (a = [a]), a = this.source.wrap(a, b), this.environment.isSimple ? ["return ", a, ";"] : c ? ["buffer += ", a, ";"] : (a.appendToBuffer = !0, a)
                    },
                    initializeBuffer: function() {
                        return this.quotedString("")
                    },
                    compile: function(a, b, c, d) {
                        this.environment = a, this.options = b, this.stringParams = this.options.stringParams, this.trackIds = this.options.trackIds, this.precompile = !d, this.name = this.environment.name, this.isChild = !!c, this.context = c || {
                            decorators: [],
                            programs: [],
                            environments: []
                        }, this.preamble(), this.stackSlot = 0, this.stackVars = [], this.aliases = {}, this.registers = {
                            list: []
                        }, this.hashes = [], this.compileStack = [], this.inlineStack = [], this.blockParams = [], this.compileChildren(a, b), this.useDepths = this.useDepths || a.useDepths || a.useDecorators || this.options.compat, this.useBlockParams = this.useBlockParams || a.useBlockParams;
                        var e = a.opcodes,
                            f = void 0,
                            g = void 0,
                            h = void 0,
                            i = void 0;
                        for (h = 0, i = e.length; i > h; h++) f = e[h], this.source.currentLocation = f.loc, g = g || f.loc, this[f.opcode].apply(this, f.args);
                        if (this.source.currentLocation = g, this.pushSource(""), this.stackSlot || this.inlineStack.length || this.compileStack.length) throw new j["default"]("Compile completed with content left on stack");
                        this.decorators.isEmpty() ? this.decorators = void 0 : (this.useDecorators = !0, this.decorators.prepend("var decorators = container.decorators;\n"), this.decorators.push("return fn;"), d ? this.decorators = Function.apply(this, ["fn", "props", "container", "depth0", "data", "blockParams", "depths", this.decorators.merge()]) : (this.decorators.prepend("function(fn, props, container, depth0, data, blockParams, depths) {\n"), this.decorators.push("}\n"), this.decorators = this.decorators.merge()));
                        var k = this.createFunctionContext(d);
                        if (this.isChild) return k;
                        var l = {
                            compiler: this.compilerInfo(),
                            main: k
                        };
                        this.decorators && (l.main_d = this.decorators, l.useDecorators = !0);
                        var m = this.context,
                            n = m.programs,
                            o = m.decorators;
                        for (h = 0, i = n.length; i > h; h++) n[h] && (l[h] = n[h], o[h] && (l[h + "_d"] = o[h], l.useDecorators = !0));
                        return this.environment.usePartial && (l.usePartial = !0), this.options.data && (l.useData = !0), this.useDepths && (l.useDepths = !0), this.useBlockParams && (l.useBlockParams = !0), this.options.compat && (l.compat = !0), d ? l.compilerOptions = this.options : (l.compiler = JSON.stringify(l.compiler), this.source.currentLocation = {
                            start: {
                                line: 1,
                                column: 0
                            }
                        }, l = this.objectLiteral(l), b.srcName ? (l = l.toStringWithSourceMap({
                            file: b.destName
                        }), l.map = l.map && l.map.toString()) : l = l.toString()), l
                    },
                    preamble: function() {
                        this.lastContext = 0, this.source = new m["default"](this.options.srcName), this.decorators = new m["default"](this.options.srcName)
                    },
                    createFunctionContext: function(a) {
                        var b = "",
                            c = this.stackVars.concat(this.registers.list);
                        c.length > 0 && (b += ", " + c.join(", "));
                        var d = 0;
                        for (var e in this.aliases) {
                            var f = this.aliases[e];
                            this.aliases.hasOwnProperty(e) && f.children && f.referenceCount > 1 && (b += ", alias" + ++d + "=" + e, f.children[0] = "alias" + d)
                        }
                        var g = ["container", "depth0", "helpers", "partials", "data"];
                        (this.useBlockParams || this.useDepths) && g.push("blockParams"), this.useDepths && g.push("depths");
                        var h = this.mergeSource(b);
                        return a ? (g.push(h), Function.apply(this, g)) : this.source.wrap(["function(", g.join(","), ") {\n  ", h, "}"])
                    },
                    mergeSource: function(a) {
                        var b = this.environment.isSimple,
                            c = !this.forceBuffer,
                            d = void 0,
                            e = void 0,
                            f = void 0,
                            g = void 0;
                        return this.source.each(function(a) {
                            a.appendToBuffer ? (f ? a.prepend("  + ") : f = a, g = a) : (f && (e ? f.prepend("buffer += ") : d = !0, g.add(";"), f = g = void 0), e = !0, b || (c = !1))
                        }), c ? f ? (f.prepend("return "), g.add(";")) : e || this.source.push('return "";') : (a += ", buffer = " + (d ? "" : this.initializeBuffer()), f ? (f.prepend("return buffer + "), g.add(";")) : this.source.push("return buffer;")), a && this.source.prepend("var " + a.substring(2) + (d ? "" : ";\n")), this.source.merge()
                    },
                    blockValue: function(a) {
                        var b = this.aliasable("helpers.blockHelperMissing"),
                            c = [this.contextName(0)];
                        this.setupHelperArgs(a, 0, c);
                        var d = this.popStack();
                        c.splice(1, 0, d), this.push(this.source.functionCall(b, "call", c))
                    },
                    ambiguousBlockValue: function() {
                        var a = this.aliasable("helpers.blockHelperMissing"),
                            b = [this.contextName(0)];
                        this.setupHelperArgs("", 0, b, !0), this.flushInline();
                        var c = this.topStack();
                        b.splice(1, 0, c), this.pushSource(["if (!", this.lastHelper, ") { ", c, " = ", this.source.functionCall(a, "call", b), "}"])
                    },
                    appendContent: function(a) {
                        this.pendingContent ? a = this.pendingContent + a : this.pendingLocation = this.source.currentLocation, this.pendingContent = a
                    },
                    append: function() {
                        if (this.isInline()) this.replaceStack(function(a) {
                            return [" != null ? ", a, ' : ""']
                        }), this.pushSource(this.appendToBuffer(this.popStack()));
                        else {
                            var a = this.popStack();
                            this.pushSource(["if (", a, " != null) { ", this.appendToBuffer(a, void 0, !0), " }"]), this.environment.isSimple && this.pushSource(["else { ", this.appendToBuffer("''", void 0, !0), " }"])
                        }
                    },
                    appendEscaped: function() {
                        this.pushSource(this.appendToBuffer([this.aliasable("container.escapeExpression"), "(", this.popStack(), ")"]))
                    },
                    getContext: function(a) {
                        this.lastContext = a
                    },
                    pushContext: function() {
                        this.pushStackLiteral(this.contextName(this.lastContext))
                    },
                    lookupOnContext: function(a, b, c, d) {
                        var e = 0;
                        d || !this.options.compat || this.lastContext ? this.pushContext() : this.push(this.depthedLookup(a[e++])), this.resolvePath("context", a, e, b, c)
                    },
                    lookupBlockParam: function(a, b) {
                        this.useBlockParams = !0, this.push(["blockParams[", a[0], "][", a[1], "]"]), this.resolvePath("context", b, 1)
                    },
                    lookupData: function(a, b, c) {
                        a ? this.pushStackLiteral("container.data(data, " + a + ")") : this.pushStackLiteral("data"), this.resolvePath("data", b, 0, !0, c)
                    },
                    resolvePath: function(a, b, c, d, e) {
                        var g = this;
                        if (this.options.strict || this.options.assumeObjects) return void this.push(f(this.options.strict && e, this, b, a));
                        for (var h = b.length; h > c; c++) this.replaceStack(function(e) {
                            var f = g.nameLookup(e, b[c], a);
                            return d ? [" && ", f] : [" != null ? ", f, " : ", e]
                        })
                    },
                    resolvePossibleLambda: function() {
                        this.push([this.aliasable("container.lambda"), "(", this.popStack(), ", ", this.contextName(0), ")"])
                    },
                    pushStringParam: function(a, b) {
                        this.pushContext(), this.pushString(b), "SubExpression" !== b && ("string" == typeof a ? this.pushString(a) : this.pushStackLiteral(a))
                    },
                    emptyHash: function(a) {
                        this.trackIds && this.push("{}"), this.stringParams && (this.push("{}"), this.push("{}")), this.pushStackLiteral(a ? "undefined" : "{}")
                    },
                    pushHash: function() {
                        this.hash && this.hashes.push(this.hash), this.hash = {
                            values: [],
                            types: [],
                            contexts: [],
                            ids: []
                        }
                    },
                    popHash: function() {
                        var a = this.hash;
                        this.hash = this.hashes.pop(), this.trackIds && this.push(this.objectLiteral(a.ids)), this.stringParams && (this.push(this.objectLiteral(a.contexts)), this.push(this.objectLiteral(a.types))), this.push(this.objectLiteral(a.values))
                    },
                    pushString: function(a) {
                        this.pushStackLiteral(this.quotedString(a))
                    },
                    pushLiteral: function(a) {
                        this.pushStackLiteral(a)
                    },
                    pushProgram: function(a) {
                        null != a ? this.pushStackLiteral(this.programExpression(a)) : this.pushStackLiteral(null)
                    },
                    registerDecorator: function(a, b) {
                        var c = this.nameLookup("decorators", b, "decorator"),
                            d = this.setupHelperArgs(b, a);
                        this.decorators.push(["fn = ", this.decorators.functionCall(c, "", ["fn", "props", "container", d]), " || fn;"])
                    },
                    invokeHelper: function(a, b, c) {
                        var d = this.popStack(),
                            e = this.setupHelper(a, b),
                            f = c ? [e.name, " || "] : "",
                            g = ["("].concat(f, d);
                        this.options.strict || g.push(" || ", this.aliasable("helpers.helperMissing")), g.push(")"), this.push(this.source.functionCall(g, "call", e.callParams))
                    },
                    invokeKnownHelper: function(a, b) {
                        var c = this.setupHelper(a, b);
                        this.push(this.source.functionCall(c.name, "call", c.callParams))
                    },
                    invokeAmbiguous: function(a, b) {
                        this.useRegister("helper");
                        var c = this.popStack();
                        this.emptyHash();
                        var d = this.setupHelper(0, a, b),
                            e = this.lastHelper = this.nameLookup("helpers", a, "helper"),
                            f = ["(", "(helper = ", e, " || ", c, ")"];
                        this.options.strict || (f[0] = "(helper = ", f.push(" != null ? helper : ", this.aliasable("helpers.helperMissing"))), this.push(["(", f, d.paramsInit ? ["),(", d.paramsInit] : [], "),", "(typeof helper === ", this.aliasable('"function"'), " ? ", this.source.functionCall("helper", "call", d.callParams), " : helper))"])
                    },
                    invokePartial: function(a, b, c) {
                        var d = [],
                            e = this.setupParams(b, 1, d);
                        a && (b = this.popStack(), delete e.name), c && (e.indent = JSON.stringify(c)), e.helpers = "helpers", e.partials = "partials", e.decorators = "container.decorators", a ? d.unshift(b) : d.unshift(this.nameLookup("partials", b, "partial")), this.options.compat && (e.depths = "depths"), e = this.objectLiteral(e), d.push(e), this.push(this.source.functionCall("container.invokePartial", "", d))
                    },
                    assignToHash: function(a) {
                        var b = this.popStack(),
                            c = void 0,
                            d = void 0,
                            e = void 0;
                        this.trackIds && (e = this.popStack()), this.stringParams && (d = this.popStack(), c = this.popStack());
                        var f = this.hash;
                        c && (f.contexts[a] = c), d && (f.types[a] = d), e && (f.ids[a] = e), f.values[a] = b
                    },
                    pushId: function(a, b, c) {
                        "BlockParam" === a ? this.pushStackLiteral("blockParams[" + b[0] + "].path[" + b[1] + "]" + (c ? " + " + JSON.stringify("." + c) : "")) : "PathExpression" === a ? this.pushString(b) : "SubExpression" === a ? this.pushStackLiteral("true") : this.pushStackLiteral("null")
                    },
                    compiler: e,
                    compileChildren: function(a, b) {
                        for (var c = a.children, d = void 0, e = void 0, f = 0, g = c.length; g > f; f++) {
                            d = c[f], e = new this.compiler;
                            var h = this.matchExistingProgram(d);
                            null == h ? (this.context.programs.push(""), h = this.context.programs.length, d.index = h, d.name = "program" + h, this.context.programs[h] = e.compile(d, b, this.context, !this.precompile), this.context.decorators[h] = e.decorators, this.context.environments[h] = d, this.useDepths = this.useDepths || e.useDepths, this.useBlockParams = this.useBlockParams || e.useBlockParams) : (d.index = h, d.name = "program" + h, this.useDepths = this.useDepths || d.useDepths, this.useBlockParams = this.useBlockParams || d.useBlockParams)
                        }
                    },
                    matchExistingProgram: function(a) {
                        for (var b = 0, c = this.context.environments.length; c > b; b++) {
                            var d = this.context.environments[b];
                            if (d && d.equals(a)) return b
                        }
                    },
                    programExpression: function(a) {
                        var b = this.environment.children[a],
                            c = [b.index, "data", b.blockParams];
                        return (this.useBlockParams || this.useDepths) && c.push("blockParams"), this.useDepths && c.push("depths"), "container.program(" + c.join(", ") + ")"
                    },
                    useRegister: function(a) {
                        this.registers[a] || (this.registers[a] = !0, this.registers.list.push(a))
                    },
                    push: function(a) {
                        return a instanceof d || (a = this.source.wrap(a)), this.inlineStack.push(a), a
                    },
                    pushStackLiteral: function(a) {
                        this.push(new d(a))
                    },
                    pushSource: function(a) {
                        this.pendingContent && (this.source.push(this.appendToBuffer(this.source.quotedString(this.pendingContent), this.pendingLocation)), this.pendingContent = void 0), a && this.source.push(a)
                    },
                    replaceStack: function(a) {
                        var b = ["("],
                            c = void 0,
                            e = void 0,
                            f = void 0;
                        if (!this.isInline()) throw new j["default"]("replaceStack on non-inline");
                        var g = this.popStack(!0);
                        if (g instanceof d) c = [g.value], b = ["(", c], f = !0;
                        else {
                            e = !0;
                            var h = this.incrStack();
                            b = ["((", this.push(h), " = ", g, ")"], c = this.topStack()
                        }
                        var i = a.call(this, c);
                        f || this.popStack(), e && this.stackSlot--, this.push(b.concat(i, ")"))
                    },
                    incrStack: function() {
                        return this.stackSlot++, this.stackSlot > this.stackVars.length && this.stackVars.push("stack" + this.stackSlot), this.topStackName()
                    },
                    topStackName: function() {
                        return "stack" + this.stackSlot
                    },
                    flushInline: function() {
                        var a = this.inlineStack;
                        this.inlineStack = [];
                        for (var b = 0, c = a.length; c > b; b++) {
                            var e = a[b];
                            if (e instanceof d) this.compileStack.push(e);
                            else {
                                var f = this.incrStack();
                                this.pushSource([f, " = ", e, ";"]), this.compileStack.push(f)
                            }
                        }
                    },
                    isInline: function() {
                        return this.inlineStack.length
                    },
                    popStack: function(a) {
                        var b = this.isInline(),
                            c = (b ? this.inlineStack : this.compileStack).pop();
                        if (!a && c instanceof d) return c.value;
                        if (!b) {
                            if (!this.stackSlot) throw new j["default"]("Invalid stack pop");
                            this.stackSlot--
                        }
                        return c
                    },
                    topStack: function() {
                        var a = this.isInline() ? this.inlineStack : this.compileStack,
                            b = a[a.length - 1];
                        return b instanceof d ? b.value : b
                    },
                    contextName: function(a) {
                        return this.useDepths && a ? "depths[" + a + "]" : "depth" + a
                    },
                    quotedString: function(a) {
                        return this.source.quotedString(a)
                    },
                    objectLiteral: function(a) {
                        return this.source.objectLiteral(a)
                    },
                    aliasable: function(a) {
                        var b = this.aliases[a];
                        return b ? (b.referenceCount++, b) : (b = this.aliases[a] = this.source.wrap(a), b.aliasable = !0, b.referenceCount = 1, b)
                    },
                    setupHelper: function(a, b, c) {
                        var d = [],
                            e = this.setupHelperArgs(b, a, d, c),
                            f = this.nameLookup("helpers", b, "helper"),
                            g = this.aliasable(this.contextName(0) + " != null ? " + this.contextName(0) + " : {}");
                        return {
                            params: d,
                            paramsInit: e,
                            name: f,
                            callParams: [g].concat(d)
                        }
                    },
                    setupParams: function(a, b, c) {
                        var d = {},
                            e = [],
                            f = [],
                            g = [],
                            h = !c,
                            i = void 0;
                        h && (c = []), d.name = this.quotedString(a), d.hash = this.popStack(), this.trackIds && (d.hashIds = this.popStack()), this.stringParams && (d.hashTypes = this.popStack(), d.hashContexts = this.popStack());
                        var j = this.popStack(),
                            k = this.popStack();
                        (k || j) && (d.fn = k || "container.noop", d.inverse = j || "container.noop");
                        for (var l = b; l--;) i = this.popStack(), c[l] = i, this.trackIds && (g[l] = this.popStack()), this.stringParams && (f[l] = this.popStack(), e[l] = this.popStack());
                        return h && (d.args = this.source.generateArray(c)), this.trackIds && (d.ids = this.source.generateArray(g)), this.stringParams && (d.types = this.source.generateArray(f), d.contexts = this.source.generateArray(e)), this.options.data && (d.data = "data"), this.useBlockParams && (d.blockParams = "blockParams"), d
                    },
                    setupHelperArgs: function(a, b, c, d) {
                        var e = this.setupParams(a, b, c);
                        return e = this.objectLiteral(e), d ? (this.useRegister("options"), c.push("options"), ["options=", e]) : c ? (c.push(e), "") : e
                    }
                },
                function() {
                    for (var a = "break else new var case finally return void catch for switch while continue function this with default if throw delete in try do instanceof typeof abstract enum int short boolean export interface static byte extends long super char final native synchronized class float package throws const goto private transient debugger implements protected volatile double import public let yield await null true false".split(" "), b = e.RESERVED_WORDS = {}, c = 0, d = a.length; d > c; c++) b[a[c]] = !0
                }(), e.isValidJavaScriptVariableName = function(a) {
                    return !e.RESERVED_WORDS[a] && /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(a)
                }, b["default"] = e, a.exports = b["default"]
        }, function(a, b, c) {
            "use strict";

            function d(a, b, c) {
                if (f.isArray(a)) {
                    for (var d = [], e = 0, g = a.length; g > e; e++) d.push(b.wrap(a[e], c));
                    return d
                }
                return "boolean" == typeof a || "number" == typeof a ? a + "" : a
            }

            function e(a) {
                this.srcFile = a, this.source = []
            }
            b.__esModule = !0;
            var f = c(5),
                g = void 0;
            try {} catch (h) {}
            g || (g = function(a, b, c, d) {
                this.src = "", d && this.add(d)
            }, g.prototype = {
                add: function(a) {
                    f.isArray(a) && (a = a.join("")), this.src += a
                },
                prepend: function(a) {
                    f.isArray(a) && (a = a.join("")), this.src = a + this.src
                },
                toStringWithSourceMap: function() {
                    return {
                        code: this.toString()
                    }
                },
                toString: function() {
                    return this.src
                }
            }), e.prototype = {
                isEmpty: function() {
                    return !this.source.length
                },
                prepend: function(a, b) {
                    this.source.unshift(this.wrap(a, b))
                },
                push: function(a, b) {
                    this.source.push(this.wrap(a, b))
                },
                merge: function() {
                    var a = this.empty();
                    return this.each(function(b) {
                        a.add(["  ", b, "\n"])
                    }), a
                },
                each: function(a) {
                    for (var b = 0, c = this.source.length; c > b; b++) a(this.source[b])
                },
                empty: function() {
                    var a = this.currentLocation || {
                        start: {}
                    };
                    return new g(a.start.line, a.start.column, this.srcFile)
                },
                wrap: function(a) {
                    var b = arguments.length <= 1 || void 0 === arguments[1] ? this.currentLocation || {
                        start: {}
                    } : arguments[1];
                    return a instanceof g ? a : (a = d(a, this, b), new g(b.start.line, b.start.column, this.srcFile, a))
                },
                functionCall: function(a, b, c) {
                    return c = this.generateList(c), this.wrap([a, b ? "." + b + "(" : "(", c, ")"])
                },
                quotedString: function(a) {
                    return '"' + (a + "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029") + '"'
                },
                objectLiteral: function(a) {
                    var b = [];
                    for (var c in a)
                        if (a.hasOwnProperty(c)) {
                            var e = d(a[c], this);
                            "undefined" !== e && b.push([this.quotedString(c), ":", e])
                        }
                    var f = this.generateList(b);
                    return f.prepend("{"), f.add("}"), f
                },
                generateList: function(a) {
                    for (var b = this.empty(), c = 0, e = a.length; e > c; c++) c && b.add(","), b.add(d(a[c], this));
                    return b
                },
                generateArray: function(a) {
                    var b = this.generateList(a);
                    return b.prepend("["), b.add("]"), b
                }
            }, b["default"] = e, a.exports = b["default"]
        }])
    }),
    function(window, document, location, jQuery, isMobile, Handlebars, undefined) {
        function init(a) {
            PlayOrPay.isInitialized = !0, PlayOrPay.uid = a, PlayOrPay.currentPathname = location.pathname, injectDependencies(function() {
                $.ajax({
                    type: "GET",
                    beforeSend: function(a) {
                        a.setRequestHeader("X-Play-or-Pay", PlayOrPay.uid)
                    },
                    xhrFields: {
                        withCredentials: !0
                    },
                    url: "https://smartwall.swisspay.ch/playorpay/" + PlayOrPay.apiVersion + "/init",
                    success: function(a) {
                        if (PlayOrPay = $.extend(PlayOrPay, a), window.__PoPTemplate && (PlayOrPay.template = window.__PoPTemplate), $(PlayOrPay.articleSelector).length) {
                            SwissPay.merchantId = PlayOrPay.merchantId || "demo", PlayOrPay.vastTag && (PlayOrPay.vastTag = PlayOrPay.vastTag.replace("[timestamp]", Math.round(1e10 * Math.random())), PlayOrPay.vast = new VAST(PlayOrPay.vastTag)), PlayOrPay.cookieUuid && setSession(PlayOrPay.cookieUuid), PlayOrPay.customCss && injectInlineCss(PlayOrPay.customCss), PlayOrPay.template.css && injectInlineCss(PlayOrPay.template.css);
                            var b = PlayOrPay.price;
                            b % 1 !== 0 && (b = b.toFixed(2)), PlayOrPay.price = b + " " + PlayOrPay.currency;
                            var c = lockArticle2();
                            getParameterByName("popCancel") ? (scrollToAnchor(c.last), saveInteraction("pay_fail")) : getParameterByName("popSuccess") && scrollToAnchor(c.last), isGranted(function(a) {
                                a ? unlockContent(c, !0) : isPaymentDone(function(a, b) {
                                    a ? grantAccess(b, !1, function(a) {
                                        a ? unlockContent(c) : PlayOrPay.vast.extractData(function(a) {
                                            vastDataExtracted(a, c)
                                        })
                                    }) : PlayOrPay.vast.extractData(function(a) {
                                        vastDataExtracted(a, c)
                                    })
                                })
                            })
                        }
                    }
                })
            })
        }

        function isGranted(a) {
            $.ajax({
                type: "GET",
                beforeSend: function(a) {
                    a.setRequestHeader("X-Play-or-Pay", PlayOrPay.uid), a.setRequestHeader("X-Insertion-Id", PlayOrPay.vast.insertionId), a.setRequestHeader("X-PoP-Session", getSession())
                },
                xhrFields: {
                    withCredentials: !0
                },
                url: "https://smartwall.swisspay.ch/playorpay/" + PlayOrPay.apiVersion + "/grantAccess",
                success: function() {
                    a(!0)
                },
                error: function() {
                    a(!1)
                }
            })
        }

        function grantAccess(a, b, c) {
            $.ajax({
                type: "POST",
                beforeSend: function(a) {
                    a.setRequestHeader("X-Play-or-Pay", PlayOrPay.uid), a.setRequestHeader("X-Insertion-Id", PlayOrPay.vast.insertionId), a.setRequestHeader("X-PoP-Session", getSession())
                },
                xhrFields: {
                    withCredentials: !0
                },
                data: {
                    type: b ? "play" : "pay",
                    hash: a,
                    template: PlayOrPay.template._id,
                    testCase: PlayOrPay.testCaseId
                },
                url: "https://smartwall.swisspay.ch/playorpay/" + PlayOrPay.apiVersion + "/grantAccess",
                success: function() {
                    return c(!0)
                },
                error: function() {
                    return c(!1)
                }
            })
        }

        function isPaymentDone(a) {
            var b = parse_str(location.search.slice(1));
            if (b = ksort(b), b.contentuid) {
                var c = "";
                for (var d in b) b.hasOwnProperty(d) && "hash" !== d && ("" !== c && (c += "&"), c += urlencode(d) + "=" + urlencode(b[d]));
                getHash(c, function(c) {
                    c === b.hash ? a(!0, c) : a(!1, c)
                })
            } else a(!1)
        }

        function getHash(a, b) {
            $.ajax({
                type: "POST",
                beforeSend: function(a) {
                    a.setRequestHeader("X-Play-or-Pay", PlayOrPay.uid), a.setRequestHeader("X-Insertion-Id", PlayOrPay.vast.insertionId), a.setRequestHeader("X-PoP-Session", getSession())
                },
                xhrFields: {
                    withCredentials: !0
                },
                data: {
                    toHash: a
                },
                url: "https://smartwall.swisspay.ch/playorpay/" + PlayOrPay.apiVersion + "/hash",
                success: function(a) {
                    b(a)
                },
                error: function() {
                    b(null)
                }
            })
        }

        function lockArticle() {
            
            var a = getLastPreviewElem(getArticle(PlayOrPay.articleSelector), PlayOrPay.threshold);
            if (Array.prototype.forEach.call(a.hidden, function(a, b) {
                    $(a).remove()
                }), PlayOrPay.truncate) {
                var b = parseFloat($(a.last).css("line-height")),
                    c = Math.round((getElemHeight(a.last) - (a.parsedHeight - a.theoricalHeight)) / b);
                $(a.last).truncate({
                    line: 1,
                    lineHeight: Math.round(c * b)
                })
            }
            return console.log("remaining", a.remaining, a), PlayOrPay.threshold = PlayOrPay.truncate ? Math.round(100 * PlayOrPay.threshold) : Math.round(100 * (1 - a.remaining)), injectTemplate(a.last, a.remaining), initPlayOrPayEvents(a), getPrice(), a
        }

        function vastDataExtracted(a, b) {
            if (a) console.log("Vast extract error", a), adBlockDetected();
            else {
                saveInteraction("impression"), PlayOrPay.vast.trackings.viewcount && (PlayOrPay.skipCb = PlayOrPay.vast.trackings.viewcount[0]), PlayOrPay.vast.customisedScript && (PlayOrPay.engagement = PlayOrPay.vast.customisedScript, PlayOrPay.vast.customisedScript.advertiser && $(".pop-advertiser-name").html(PlayOrPay.engagement.advertiser)), PlayOrPay.vast.customisedScript && PlayOrPay.vast.customisedScript.sponsor && PlayOrPay.vast.customisedScript.sponsor.logo ? (setLogo(PlayOrPay.vast.customisedScript.sponsor.logo), PlayOrPay.vast.customisedScript.sponsor.trackingPixel && (PlayOrPay.vast._addTracking("sponsorPixel", PlayOrPay.engagement.sponsor.trackingPixel), PlayOrPay.vast.track("sponsorPixel")), $(".pop-logo-wrapper").show(), $(".pop-player-wrapper").hide(), $(".pop-thumbnail-wrapper").remove()) : PlayOrPay.vast.customisedScript && PlayOrPay.vast.customisedScript.sponsorLogo ? (setLogo(PlayOrPay.vast.customisedScript.sponsorLogo), $(".pop-logo-wrapper").show(), $(".pop-player-wrapper").hide(), $(".pop-thumbnail-wrapper").remove()) : (PlayOrPay.vast.customisedScript && PlayOrPay.vast.customisedScript.sponsor && PlayOrPay.vast.customisedScript.sponsor.teaser ? (PlayOrPay.thumbnail = PlayOrPay.vast.customisedScript.sponsor.teaser, PlayOrPay.vast.customisedScript.sponsor.trackingPixel && (PlayOrPay.vast._addTracking("sponsorPixel", PlayOrPay.engagement.sponsor.trackingPixel), PlayOrPay.vast.track("sponsorPixel"))) : PlayOrPay.vast.customisedScript && PlayOrPay.vast.customisedScript.sponsorTeaser ? PlayOrPay.thumbnail = PlayOrPay.vast.customisedScript.sponsorTeaser : PlayOrPay.thumbnail = PlayOrPay.vast.staticResource || PlayOrPay.thumbnail, setBackground(PlayOrPay.thumbnail), $(".pop-logo-only").remove(), $(".pop-logo-wrapper").remove()), (isMobile.apple.phone || isMobile.apple.ipod) && setInlineVideo(PlayOrPay.vast.mediaFiles, b, !0), isMobile.apple.ipod || isMobile.apple.phone || setInlineVideo(PlayOrPay.vast.mediaFiles, b, !1);
                var c = PlayOrPay.vast.duration;
                PlayOrPay.skipCb && c > PlayOrPay.skipOffset && (c = PlayOrPay.skipOffset), updateDuration(c), $(".pop-spinner").hide(), $(".pop-no-spinner").show(), $("#pop-play").removeAttr("disabled")
            }
        }

        function injectTemplate(a, b) {
            Handlebars.registerHelper("translate", function(a, b) {
                return new Handlebars.SafeString(translate(a, b.hash))
            });
            var c = Handlebars.compile(PlayOrPay.template.html);
            $(a).after(c(PlayOrPay))
        }

        function initPlayOrPayEvents(a) {
            var b = $(".pop-container");
            if (!b || !b[0]) return setTimeout(initPlayOrPayEvents, 50);
            var c = $(".pop-container .pop-player-wrapper"),
                d = $(".pop-container .pop-controls"),
                e = $(".pop-container #pop-pay"),
                f = $(".pop-container #pop-play"),
                g = $(".pop-duration-remaining"),
                h = $(".pop-footer"),
                i = $(".pop-header"),
                j = $(".pop-player-control"),
                k = $(".pop-mute"),
                l = $(".pop-unmute"),
                m = $(".pop-close-ad"),
                n = $("#pop-play-video"),
                o = $(".pop-logo-wrapper");
            PlayOrPay.adsDuration && updateDuration(PlayOrPay.adsDuration), setBackground(PlayOrPay.thumbnail), $(".pop-no-spinner").hide(), o.hide(), c.hide(), d.show(), g.hide(), j.hide(), n.hide(), f.on("click", function() {
                i.css("opacity", 0), d.hide(), d.hide(), c.show(), g.show(), h.hide(), j.show(), l.hide(), isMobile.any && (l.hide(), k.hide())
            }), n.on("click", function() {
                n.hide(), j.show()
            }), m.on("click", function() {
                i.css("opacity", 1), d.show(), c.hide(), g.hide(), h.show(), j.hide()
            }), e.on("click", startPayment)
        }

        function setInlineVideo(a, b, c) {
            var d = "";
            $.each(a, function(a, b) {
                d += '<source src="' + b.source + '" type="' + b.attributes.type + '">'
            }), c ? ($("#pop-ads").after('<video class="video pop-inline-video" muted="" preload="none" > ' + d + '       Your browser does not support HTML5 video.        </video><div  id="pop-canvas-video"><canvas class="canvas pop-inline-canvas pop-video"></canvas></div>'), PlayOrPay.video = window.canvasVideo = new CanvasVideoPlayer({
                videoSelector: ".pop-inline-video",
                canvasSelector: ".pop-inline-canvas",
                audio: !0,
                framesPerSecond: 25
            })) : ($("#pop-ads").after('<video class="video pop-inline-video  pop-video" preload="none"> ' + d + "       Your browser does not support HTML5 video.        </video>"), PlayOrPay.video = new VideoPlayer({
                videoSelector: ".pop-inline-video"
            }));
            var e, f = $(".pop-container .pop-player-wrapper"),
                g = $(".pop-container .pop-controls"),
                h = $(".pop-container #pop-play"),
                i = $(".pop-duration-remaining"),
                j = $(".pop-player-control"),
                k = $(".pop-mute"),
                l = $(".pop-unmute"),
                m = $(".pop-close-ad"),
                n = $("#pop-play-video"),
                o = $(".pop-video");
            f.hide(), g.show(), i.hide(), j.hide(), n.hide(), PlayOrPay.video.on("mute", function(a) {
                a && a.mute ? (PlayOrPay.vast.track("mute"), k.hide(), l.show()) : (PlayOrPay.vast.track("unmute"), l.hide(), k.show())
            });
            var p = 0,
                q = !1,
                r = !1,
                s = !1;
            PlayOrPay.video.on("start", function() {
                PlayOrPay.vast.track("creativeView"), PlayOrPay.vast.track("impression"), PlayOrPay.vast.track("start"), saveInteraction("play_start")
            }), PlayOrPay.video.on("time", function(a) {
                PlayOrPay.skipCb && p < PlayOrPay.skipOffset && a.position >= PlayOrPay.skipOffset && (PlayOrPay.skipable = !0, e = $('<div class="jw-skin-seven"><div class="jw-skip jw-background-color jw-reset jw-skippable"> <span class="jw-text jw-skiptext jw-reset">' + translate("skip") + ' </span><span class="jw-icon-inline jw-skip-icon jw-reset"></span></div></div>'), j.append(e), e.on("click", function() {
                    PlayOrPay.vast.track("skip"), saveInteraction("skip"), grantAccess(null, !0, function() {
                        unlockContent(b, !0), setTimeout(function() {
                            PlayOrPay.video.pause()
                        }, 500), f.remove()
                    })
                }), m.hide(), PlayOrPay.vast.track("viewcount"), saveInteraction("viewcount")), p = a.position, !q && a.position / a.duration >= .25 && (q = !0, PlayOrPay.vast.track("firstQuartile"), saveInteraction("firstQuartile"), delete PlayOrPay.vast.trackings.firstQuartile), !s && a.position / a.duration >= .5 && (s = !0, PlayOrPay.vast.track("midpoint"), saveInteraction("midpoint"), delete PlayOrPay.vast.trackings.midpoint), !r && a.position / a.duration >= .75 && (r = !0, PlayOrPay.vast.track("thirdQuartile"), saveInteraction("thirdQuartile"), delete PlayOrPay.vast.trackings.thirdQuartile);
                var c = PlayOrPay.skipCb && a.duration > PlayOrPay.skipOffset ? PlayOrPay.skipOffset : a.duration;
                updateDuration(c - a.position)
            }), PlayOrPay.video.on("complete", function() {
                PlayOrPay.vast.track("complete"), saveInteraction("complete"), PlayOrPay.skipable || (PlayOrPay.vast.track("viewcount"),
                    saveInteraction("viewcount")), grantAccess(null, !0, function() {
                    unlockContent(b, !0), setTimeout(function() {
                        PlayOrPay.video.pause()
                    }, 500), f.remove()
                })
            }), h.on("click", function() {
                PlayOrPay.video.started && (PlayOrPay.vast.track("resume"), saveInteraction("resume")), $(".pop-hide-play").hide(), PlayOrPay.video.play()
            }), n.on("click", function() {
                PlayOrPay.video.started && (PlayOrPay.vast.track("resume"), saveInteraction("resume")), PlayOrPay.video.play(), $(".pop-hide-play").hide()
            }), k.on("click", function() {
                PlayOrPay.video.setMute(!0)
            }), l.on("click", function() {
                PlayOrPay.video.setMute(!1)
            }), m.on("click", function() {
                PlayOrPay.vast.track("pause"), saveInteraction("pause"), PlayOrPay.video.pause(), $(".pop-hide-play").show()
            }), o.on("click", function() {
                PlayOrPay.vast.clickThrough && (PlayOrPay.vast.track("clickTracking"), saveInteraction("clickVideo"), window.open(PlayOrPay.vast.clickThrough, "_blank"))
            }), $(window).scroll(function() {
                !f.is(":in-viewport") && PlayOrPay.video.playing ? (PlayOrPay.video.started && (PlayOrPay.vast.track("pause"), saveInteraction("pause")), PlayOrPay.video.pause()) : f.is(":in-viewport") && !PlayOrPay.video.playing && (m.is(":visible") || e && e.is(":visible")) && (PlayOrPay.video.started && (PlayOrPay.vast.track("resume"), saveInteraction("resume")), PlayOrPay.video.play())
            }), $(window).blur(function() {
                PlayOrPay.video.playing && (PlayOrPay.video.started && (PlayOrPay.vast.track("pause"), saveInteraction("pause")), PlayOrPay.video.pause(!0))
            }), $(window).focus(function() {
                !PlayOrPay.video.playing && (m.is(":visible") || e && e.is(":visible")) && (PlayOrPay.video.started && (PlayOrPay.vast.track("resume"), saveInteraction("resume")), PlayOrPay.video.play(!0))
            })
        }

        function scrollToAnchor(a) {
            $("html, body").animate({
                scrollTop: $(a).offset().top
            }, 300)
        }

        function translate(a, b) {
            var c = PlayOrPay.lang || "EN",
                d = I18N[c][a];
            for (var e in b) b.hasOwnProperty(e) && (d = d.replace("{{" + e + "}}", b[e]));
            return d
        }

        function setBackground(a) {
            $(".pop-controls").css("background-image", "url(" + a + ")"), $(".pop-logo-wrapper .pop-controls").css("background-image", "none")
        }

        function setLogo(a) {
            $(".pop-container .pop-logo-wrapper .pop-button-advertiser > img").attr("src", a), $(".pop-container .pop-sponsor-logo").attr("src", a)
        }

        function updateDuration(a) {
            a = a || 0;
            var b = Math.round(a % 60),
                c = Math.floor(a / 60);
            $(".pop-duration-seconds").text(b), 10 > b && (b = "0" + b), $(".pop-controls-container .pop-duration").text("(" + c + ":" + b + ")"), PlayOrPay.skipable ? $(".pop-duration-remaining .pop-center").html(translate("countdownSkip")) : $(".pop-duration-remaining .pop-duration").text(Math.round(a))
        }

        function startPayment() {
            var a = PlayOrPay.currentPathname + "-" + Math.round(1e4 * Math.random()),
                b = "Play or pay paiement article",
                c = updateUrlParameter(location.href, "popCancel", 1),
                d = updateUrlParameter(location.href, "popSuccess", 1),
                e = "cancel_url=" + urlencode(c);
            e += "&contentuid=" + urlencode(a), e += "&merchantid=" + urlencode(SwissPay.merchantId), e += "&return_url=" + urlencode(d), e += "&title=" + urlencode(b), getHash(e, function(a) {
                a && (location.href = SwissPay.url + SwissPay.payment + "?" + e + "&hin=" + a)
            }), saveInteraction("pay_start")
        }

        function unlockContent(a, b) {
            var c = $(".pop-container"),
                d = null;
            b && PlayOrPay.engagement && (d = '<div class="pop-container"><div class="pop-engagement">', PlayOrPay.engagement.advertiser && (d += '<div class="pop-center pop-margin">' + translate("engagementTitle") + " " + PlayOrPay.engagement.advertiser + "</div>"), d += '<div style="text-align: center">', PlayOrPay.engagement.bannerReminder ? d += '<a id="pop-more" class="" href=""><img src="' + PlayOrPay.engagement.bannerReminder + '" width="100%"></a>' : PlayOrPay.engagement.reminder ? PlayOrPay.engagement.reminder.banner ? (d += '<a id="pop-more" class="" href="' + PlayOrPay.engagement.reminder.clickCommand + '" target="_blank"><img src="' + PlayOrPay.engagement.reminder.banner + '" width="100%"></a>', PlayOrPay.engagement.reminder.trackingPixel && (PlayOrPay.vast._addTracking("reminderPixel", PlayOrPay.engagement.reminder.trackingPixel), PlayOrPay.vast.track("reminderPixel"))) : (PlayOrPay.engagement.reminder.videoLink && (d += '<a id="pop-video-link" class="pop-button pop-primary pop-button-icon" href="' + PlayOrPay.engagement.reminder.videoLink + '" target="_blank"><img src="https://smartwall.swisspay.ch/ic-play.png">' + translate("watchAgain") + "</a>"), PlayOrPay.engagement.reminder.more && (d += '<a id="pop-more" class="pop-button pop-button-icon pop-primary pop-button-icon-right" href="' + PlayOrPay.engagement.reminder.more + '" target="_blank">' + translate("more") + '<img src="https://smartwall.swisspay.ch/ic-more.png"></a>')) : (PlayOrPay.engagement.videoLink && (d += '<a id="pop-video-link" class="pop-button pop-primary pop-button-icon" href="' + PlayOrPay.engagement.videoLink + '" target="_blank"><img src="https://smartwall.swisspay.ch/ic-play.png">' + translate("watchAgain") + "</a>"), PlayOrPay.engagement.more && (d += '<a id="pop-more" class="pop-button pop-button-icon pop-primary pop-button-icon-right" href="' + PlayOrPay.engagement.more + '" target="_blank">' + translate("more") + '<img src="https://smartwall.swisspay.ch/ic-more.png"></a>')), d += "</div></div></div>", saveInteraction("engagement_print")), a && a.hidden && (Array.prototype.forEach.call(a.hidden.reverse(), function(a, b) {
                resetEmbeddedElem(a), c.after(a.outerHTML)
            }), d && ($(PlayOrPay.articleSelector).append(d), $(".pop-container #pop-video-link").click(function() {
                return saveInteraction("engagement_video_click"), !0
            }), $(".pop-container #pop-more").click(function() {
                return saveInteraction("engagement_more_click"), !0
            })), c.css("overflow", "hidden").css("max-height", 0), setTimeout(function() {
                c.remove(), PlayOrPay.truncate && $(a.last).truncate("expand")
            }, 500), reloadEmbeddedElem()), PlayOrPay.isUnlocked = !0
        }

        function reloadEmbeddedElem() {
            var widgets = {
                twitter: {
                    global: "twttr",
                    load: "twttr.widgets.load()"
                }
            };
            $.each(widgets, function(key, widget) {
                window[widget.global] && setTimeout(function() {
                    eval(widget.load)
                }, 500)
            })
        }

        function resetEmbeddedElem(a) {
            var b = {
                twitter: {
                    attr: "class",
                    value: "twitter-tweet",
                    removeClass: "twitter-tweet-error",
                    whitelist: ["class", "data-lang", "lang"]
                }
            };
            return $.each(b, function(b, c) {
                $(a).each(function() {
                    if (c.removeClass && $(this).removeClass(c.removeClass), $(this).attr(c.attr) === c.value)
                        for (var a = this.attributes, b = a.length; b--;) {
                            var d = a[b]; - 1 == $.inArray(d.name, c.whitelist) && this.removeAttributeNode(d)
                        }
                })
            }), a
        }

        function hide(a) {
            a.style.display = "none"
        }

        function show(a) {
            a.style.display = ""
        }

        function getPrice() {
            var a = "merchantid=" + SwissPay.merchantId;
            getHash(a, function(b) {
                b && $.ajax({
                    type: "GET",
                    url: SwissPay.url + SwissPay.getPrice + "?" + a + "&hin=" + b,
                    success: function(a) {
                        if (a && a.price && a.currency && "unknown" !== a.price) {
                            PlayOrPay.price = a.price + " " + a.currency, $(".pop-price").text(PlayOrPay.price);
                            var b = $(".pop-operator-country-" + a.country + ".pop-operator-" + a.operator);
                            b.length && ($(".pop-operator-default").hide(), b.show())
                        }
                    },
                    error: function() {}
                })
            })
        }

        function getLastPreviewElem(a, b) {
            if (a) {
                var c = getElemHeight(a),
                    d = a.children,
                    e = 0,
                    f = {
                        visible: [],
                        last: null,
                        hidden: []
                    };
                return Array.prototype.forEach.call(d, function(a, d) {
                    f.last ? f.hidden.push(a) : (e += getElemHeight(a), e / c >= b ? (f.last = a, f.parsedHeight = e, f.theoricalHeight = Math.round(c * b), f.visible.push(a), f.remaining = 1 - e / c) : f.visible.push(a))
                }), f
            }
        }

        function getElemHeight(a, b) {
            var c = a.offsetHeight,
                d = getComputedStyle(a);
            return c += parseInt(d.marginTop) + parseInt(d.marginBottom), b ? c : a.offsetHeight
        }

        function getArticle(a) {
            var b = $(a);
            return b && 1 === b.length ? b[0] : null
        }

        function injectDependencies(a) {
            injectStyle("https://smartwall.swisspay.ch/play-or-pay-1.0.0.css"), a()
        }

        function saveInteraction(a) {
            $.ajax({
                type: "POST",
                beforeSend: function(a) {
                    a.setRequestHeader("X-Play-or-Pay", PlayOrPay.uid), a.setRequestHeader("X-Insertion-Id", PlayOrPay.vast.insertionId), a.setRequestHeader("X-PoP-Session", getSession())
                },
                xhrFields: {
                    withCredentials: !0
                },
                data: {
                    interaction: a,
                    template: PlayOrPay.template._id,
                    testCase: PlayOrPay.testCaseId
                },
                url: "https://smartwall.swisspay.ch/playorpay/" + PlayOrPay.apiVersion + "/interaction",
                success: function() {}
            })
        }

        function detectAdblock(a) {
            "undefined" == typeof blockAdBlock ? adBlockDetected() : (blockAdBlock.onDetected(adBlockDetected), blockAdBlock.check())
        }

        function adBlockDetected() {
            PlayOrPay.adBlockDetected = !0, $(".pop-hide-adb").remove(), $(".pop-hide-adb-opacity").css("opacity", 0), $(".pop-container #pop-play").off(), $(".pop-spinner").hide(), $(".pop-container .pop-ad-control").length ? $(".pop-container .pop-ad-control").html("<p>" + translate("adblock") + "</p>") : $(".pop-container .pop-controls").append('<div class="pop-adb-container"><div>' + translate("adblock") + "</div></div>")
        }

        function injectScript(a, b) {
            var c = document.createElement("script");
            c.src = a, c.type = "text/javascript", c.async = "true", c.onload = c.onreadystatechange = function() {
                var a = this.readyState;
                if (!a || "complete" == a || "loaded" == a) return b ? b() : void 0
            };
            var d = document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0];
            d.appendChild(c)
        }

        function injectStyle(a) {
            var b = document.createElement("link");
            b.rel = "stylesheet", b.async = !0, b.href = a, (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(b)
        }

        function injectInlineCss(a) {
            var b = document.createElement("style");
            document.body.appendChild(b), b.innerHTML = a
        }

        function setSession(a) {
            try {
                "object" == typeof window.localStorage && window.localStorage.setItem("X-PoP-Session", a)
            } catch (b) {}
        }

        function getSession() {
            var a;
            try {
                "object" == typeof window.localStorage && (a = window.localStorage.getItem("X-PoP-Session"))
            } catch (b) {
                a = null
            }
            return a || PlayOrPay.cookieUuid
        }

        function urlencode(a) {
            return a = (a + "").toString(), encodeURIComponent(a).replace(/!/g, "%21").replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\*/g, "%2A").replace(/%20/g, "+")
        }

        function parse_str(a, b) {
            var c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r = String(a).replace(/^&/, "").replace(/&$/, "").split("&"),
                s = r.length,
                t = function(a) {
                    return decodeURIComponent(a.replace(/\+/g, "%20"))
                };
            for (b || (b = {}), c = 0; s > c; c++) {
                for (l = r[c].split("="), m = t(l[0]), n = l.length < 2 ? "" : t(l[1]);
                    " " === m.charAt(0);) m = m.slice(1);
                if (m.indexOf("\x00") > -1 && (m = m.slice(0, m.indexOf("\x00"))), m && "[" !== m.charAt(0)) {
                    for (p = [], o = 0, d = 0; d < m.length; d++)
                        if ("[" !== m.charAt(d) || o) {
                            if ("]" === m.charAt(d) && o && (p.length || p.push(m.slice(0, o - 1)), p.push(m.substr(o, d - o)), o = 0, "[" !== m.charAt(d + 1))) break
                        } else o = d + 1;
                    for (p.length || (p = [m]), d = 0; d < p[0].length && (k = p[0].charAt(d), (" " === k || "." === k || "[" === k) && (p[0] = p[0].substr(0, d) + "_" + p[0].substr(d + 1)), "[" !== k); d++);
                    for (h = b, d = 0, q = p.length; q > d; d++)
                        if (m = p[d].replace(/^['"]/, "").replace(/['"]$/, ""), i = d !== p.length - 1, g = h, "" !== m && " " !== m || 0 === d) h[m] === j && (h[m] = {}), h = h[m];
                        else {
                            e = -1;
                            for (f in h) h.hasOwnProperty(f) && +f > e && f.match(/^\d+$/g) && (e = +f);
                            m = e + 1
                        }
                    g[m] = n
                }
            }
            return b
        }

        function ksort(a, b) {
            var c, d, e, f = {},
                g = [],
                h = this,
                i = !1,
                j = {};
            switch (b) {
                case "SORT_STRING":
                    c = function(a, b) {
                        return h.strnatcmp(a, b)
                    };
                    break;
                case "SORT_LOCALE_STRING":
                    var k = this.i18n_loc_get_default();
                    c = this.php_js.i18nLocales[k].sorting;
                    break;
                case "SORT_NUMERIC":
                    c = function(a, b) {
                        return a + 0 - (b + 0)
                    };
                    break;
                default:
                    c = function(a, b) {
                        var c = parseFloat(a),
                            d = parseFloat(b),
                            e = c + "" === a,
                            f = d + "" === b;
                        return e && f ? c > d ? 1 : d > c ? -1 : 0 : e && !f ? 1 : !e && f ? -1 : a > b ? 1 : b > a ? -1 : 0
                    }
            }
            for (e in a) a.hasOwnProperty(e) && g.push(e);
            for (g.sort(c), this.php_js = this.php_js || {}, this.php_js.ini = this.php_js.ini || {}, i = this.php_js.ini["phpjs.strictForIn"] && this.php_js.ini["phpjs.strictForIn"].local_value && "off" !== this.php_js.ini["phpjs.strictForIn"].local_value, j = i ? a : j, d = 0; d < g.length; d++) e = g[d], f[e] = a[e], i && delete a[e];
            for (d in f) f.hasOwnProperty(d) && (j[d] = f[d]);
            return i || j
        }

        function isInitialized() {
            return !!PlayOrPay.isInitialized
        }

        function isUnlocked() {
            return !!PlayOrPay.isUnlocked
        }

        function updateUrlParameter(a, b, c) {
            var d = a.indexOf("#"),
                e = -1 === d ? "" : a.substr(d);
            a = -1 === d ? a : a.substr(0, d);
            var f = new RegExp("([?&])" + b + "=.*?(&|$)", "i"),
                g = -1 !== a.indexOf("?") ? "&" : "?";
            return a = a.match(f) ? a.replace(f, "$1" + b + "=" + c + "$2") : a + g + b + "=" + c, a + e
        }

        function getParameterByName(a, b) {
            b || (b = location.href), b = b.toLowerCase(), a = a.replace(/[\[\]]/g, "\\$&").toLowerCase();
            var c = new RegExp("[?&]" + a + "(=([^&#]*)|&|#|$)"),
                d = c.exec(b);
            return d ? d[2] ? decodeURIComponent(d[2].replace(/\+/g, " ")) : "" : null
        }
        var $ = jQuery.noConflict(!0),
            PlayOrPay = {
                apiVersion: "v1",
                skipOffset: 20
            },
            SwissPay = {
                url: "//public.3gsecu.com",
                payment: "/playorpay",
                getPrice: "/api_playorpay_get_price",
                merchantId: "demo"
            },
            I18N = {
                FR: {
                    adblock: '<a href="https://www.swisspay.ch/smart-wall-adblock/" target="_blank">Désactivez adblock</a> pour regarder la vidéo et débloquer la suite de l\'article',
                    watch: "Regarder la vidéo",
                    iWatch: "Je regarde la vidéo",
                    "continue": "Continuer",
                    limitReached: "Vous avez lu {{threshold}}% de cet article.<br> Pour lire la suite, veuillez choisir une option",
                    pay: 'Acheter cet article: <span class="pop-price">{{price}}</span>',
                    iPay: 'J\'achète cet article: <span class="pop-price">{{price}}</span>',
                    iBuy: 'Je paie <span class="pop-price">{{price}}</span>',
                    noSubscription: "Sans inscription",
                    twoClicks: "En deux clics",
                    "2Clicks": "Avec mon mobile",
                    or: "OU",
                    adCountdown: 'Continuer à lire l\'article dans <span class="pop-duration"></span>s',
                    countdownSkip: "Vous pouvez maintenant poursuivre votre lecture.",
                    skip: "» Passer",
                    engagementTitle: "Cet article vous a été offert par:",
                    offerBy: 'Offert par <span class="pop-advertiser-name"></span>',
                    articleOfferBy: 'Article offert par <span class="pop-advertiser-name"></span>',
                    watchAgain: "Revoir la vidéo",
                    more: "En savoir plus",
                    free: "Accès gratuit",
                    accessFree: "Accéder gratuitement à l'article",
                    poweredBy: "Powered by",
                    easyFast: "Facile et rapide, sans inscription"
                },
                EN: {
                    adblock: '<a href="https://www.swisspay.ch/smart-wall-adblock/" target="_blank">Disable adblock</a> to watch the video and unlock the rest of the article',
                    watch: "Watch the video",
                    iWatch: "I watch the video",
                    "continue": "Continue",
                    limitReached: "You have read {{threshold}}% of this article.<br>To continue reading, please select one of 2 options",
                    pay: 'Buy this article: <span class="pop-price">{{price}}</span>',
                    iPay: 'I buy this article: <span class="pop-price">{{price}}</span>',
                    iBuy: 'I pay  <span class="pop-price">{{price}}</span>',
                    noSubscription: "No subscription.",
                    twoClicks: "with my phone",
                    "2Clicks": "2 clicks.",
                    or: "OR",
                    adCountdown: 'Continue reading the article in <span class="pop-duration"></span>s',
                    countdownSkip: "You can now continue reading.",
                    skip: "» Skip",
                    engagementTitle: "This article was brought to you by:",
                    watchAgain: "Watch again",
                    offerBy: 'Provided by <span class="pop-advertiser-name"></span>',
                    articleOfferBy: 'Article provided by <span class="pop-advertiser-name"></span>',
                    more: "Learn more",
                    free: "Free access.",
                    accessFree: "Enjoy free access to the article",
                    poweredBy: "Powered by",
                    easyFast: "Easy, fast, without subscription"
                }
            };
        return window.PoP = {
            init: init,
            isInitialized: isInitialized,
            isUnlocked: isUnlocked
        }
    }(window, document, location, jQuery, isMobile, Handlebars);
