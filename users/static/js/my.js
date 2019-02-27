//扩展的localStorage方法
function Lstorage() {
    "use strict";
    var m = {
        set: function (key, value) {
            var item = {data: value};
            localStorage.setItem(key, JSON.stringify(item));
        },
        get: function (key) {
            var value = localStorage.getItem(key);
            if (!value) {
                return null;
            }
            value = JSON.parse(value);
            return value.data;
        },
        remove: function (key) {
            localStorage.removeItem(key);
            return null;
        },
        clear: function () {
            localStorage.clear();
        }
    };
    return m;
}

//扩展的sessionStorage方法
function Sstorage() {
    "use strict";
    var m = {
        set: function (key, value) {
            var item = {data: value};
            sessionStorage.setItem(key, JSON.stringify(item));
        },
        get: function (key) {
            var value = sessionStorage.getItem(key);
            if (!value) {
                return null;
            }
            value = JSON.parse(value);
            return value.data;
        },
        remove: function (key) {
            sessionStorage.removeItem(key);
            return null;
        },
        clear: function () {
            sessionStorage.clear();
        }
    };
    return m;
}

//百度地图相关方法的封装
function myMap() {
    "use strict";
    var m = {
        map: null,
        offsetY: 120,
        callback: null,
        localIcon: null,
        GetVer: -1,//获取版本号
        DragVer: 0,//拖动版本号
        location: null,//用户定位地点
        driversMarkers: [],//存储司机的marker数组
        locationMarkers:[],
        init: function (container, offset, localIcon, callback) {
            if (offset) {
                this.offsetY = offset;
            }
            this.localIcon = localIcon;
            this.callback = callback;
            this.map = new BMap.Map(container);
            var point = new BMap.Point(116.404, 39.915);
            this.map.centerAndZoom(point, 15);
        },
        setCenter: function(point){
            var _this = this;
            _this.map.panTo(point);
            _this.locationMk(point);
            //获得中心点的像素坐标
            var centerPixel = _this.map.pointToOverlayPixel(_this.map.getCenter());
            var newCenterPoint = _this.map.overlayPixelToPoint({
                x: centerPixel.x,
                y: centerPixel.y + _this.offsetY
            });
            _this.map.setCenter(newCenterPoint);
        },
        geolocation: function () {
            var geo = new BMap.Geolocation();
            var _this = this;
            geo.getCurrentPosition(function (res) {
                if (this.getStatus() === BMAP_STATUS_SUCCESS) {
                    //记录用户当前的位置
                    _this.location = res.point;
                    _this.geocoder(res.point);
                    _this.setCenter(res.point);
                    //显示定位图标
                    _this.localIcon.show();

                    _this.move();
                }else{
                    alert('获取不到当前位置，请检查您的手机是否开启了“允许微信使用位置服务”');
                }
            });
        },
        moveHandle: function (e) {
            var _this = this;
            _this.DragVer++;
            //获得当前center点
            var curCenterPixel = _this.map.pointToOverlayPixel(_this.map.getCenter());
            //获得定位图标所在位置并标点或者获取经纬度，解析地址
            var localIconPoint = _this.map.overlayPixelToPoint({
                x: curCenterPixel.x,
                y: curCenterPixel.y - _this.offsetY
            });
            _this.locationMk(localIconPoint);
            _this.geocoder(localIconPoint);
        },
        listener: null,
        move: function () {
            var _this = this;
            var func = function () {
                _this.moveHandle();
            };
            _this.listener = func;
            _this.map.addEventListener('dragend', _this.listener);
        },
        dismove: function () {
            var _this = this;
            _this.map.removeEventListener('dragend', _this.listener);
        },
        geocoder: function (point) {//逆解析地址
            var _this = this;
            var mygeo = new BMap.Geocoder();
            mygeo.getLocation(point, function (result) {
                if (result) {
                    var title = null;
                    var pp = null;
                    if (result.surroundingPois.length) {
                        title = result.surroundingPois[0].title;
                        pp = result.surroundingPois[0].point;
                    } else {
                        title = result.addressComponents.street + result.addressComponents.streetNumber;
                        pp = result.point;
                    }
                    if (!title) {
                        title = result.address;
                    }
                    if (_this.callback) {
                        _this.callback({title: title, point: pp}, result);
                    }
                }
            });
        },
        locationMk: function (point) {//在地图上添加定位点
            var icon = new BMap.Icon('/frontend/web/cloudcar/images/location.png', new BMap.Size(14, 14));
            icon.setImageSize(new BMap.Size(14, 14));
            var lmk = new BMap.Marker(point, {icon: icon});
            if(this.locationMarkers.length){
                this.removeMk(this.locationMarkers);
                this.locationMarkers = [];
            }
            this.locationMarkers.push(lmk);
            this.map.addOverlay(lmk);
        },
        removeMk: function (mks) {
            for (var i = 0; i < mks.length; i++) {
                this.map.removeOverlay(mks[i]);
            }
        },
        driversMk: function (points) {
            var _this = this;
            if (!points.length) {
                return null;
            }
            if (_this.driversMarkers.length) {
                _this.removeMk(_this.driversMarkers);
                _this.driversMarkers = [];
            }
            //添加司机marker
            var icon = new BMap.Icon('/frontend/web/cloudcar/images/driver.png', new BMap.Size(28, 34));
            icon.setImageSize(new BMap.Size(28, 34));

            function addMarker(point) {
                var marker = new BMap.Marker(point, {icon: icon});
                _this.map.addOverlay(marker);
                _this.driversMarkers.push(marker);
            }

            var len = points.length;
            for (var i = 0; i < len; i++) {
                addMarker(points[i]);
            }
            // var bounds = _this.map.getBounds();
            // var sw = bounds.getSouthWest();
            // var ne = bounds.getNorthEast();
            // var lngSpan = Math.abs(sw.lng - ne.lng);
            // var latSpan = Math.abs(ne.lat - sw.lat);
            // for (var i = 0; i < 5; i ++) {
            //     var point = new BMap.Point(sw.lng + lngSpan * (Math.random() * 0.7), ne.lat - latSpan * (Math.random() * 0.7));
            //     addMarker(point);
            // }
        }
    };
    return m;
}

function SubstituteDriving() {
    "use strict";
    var m = {
        id: '',
        city: '',
        //下单地址
        orderCommit: '',
        orderReserve: '',
        //拉取订单信息
        orderPolling: '',
        //预估费用
        orderCostestimate: '',
        //获取附近的司机
        nearbyDriver: '',
        //订单司机位置
        orderDriverPosition: '',
        //订单费用详情
        orderPay: '',
        //取消订单
        orderCancel: '',
        mobile: '',
        couponId: '',
        couponSn: '',
        bookingId: null,
        bookingType: null,
        orderId: null,
        driverId: null,
        //派单状态
        pollingState: null,
        //订单状态
        orderState: null,
        //出发地
        startPoint: {
            address: '',
            lat: null,
            lng: null
        },
        //目的地
        endPoint: {
            address: '',
            lat: null,
            lng: null
        },
		 //预估费用金额
		  fee:0,
        begin:0,
		
        //初始化,设置各个方法需要的url地址
        init: function (orderCommit, orderPolling, orderCostestimate, nearbyDriver, orderDriverPosition, orderPay, orderCancel,orderReserve) {
            this.orderCommit = orderCommit;
            this.orderPolling = orderPolling;
            this.orderCostestimate = orderCostestimate;
            this.nearbyDriver = nearbyDriver;
            this.orderDriverPosition = orderDriverPosition;
            this.orderPay = orderPay;
            this.orderCancel = orderCancel;
            this.orderReserveUrl = orderReserveUrl;
        },
        reset: function () {
            this.bookingId = '';
            this.bookingType = '';
            this.orderId = '';
            this.orderState = '';
            this.pollingState = '';
            this.driverId = '';
        },
        setStartPoint: function (address, lat, lng) {
            this.startPoint.address = address;
            this.startPoint.lat = lat;
            this.startPoint.lng = lng;
        },
        checkStartPoint: function () {
            var s = this.startPoint;
            return !(!s.address || !s.lat || !s.lng);

        },
        setEndPoint: function (address, lat, lng) {
            this.endPoint.address = address;
            this.endPoint.lat = lat;
            this.endPoint.lng = lng;
        },
        checkEndPoint: function () {
            var s = this.endPoint;
            return !(!s.address || !s.lat || !s.lng);
        },
        setLocalCity: function (city) {
            this.city = city;
        },
        setCoupon: function (id, sn) {
            this.couponId = id;
            this.couponSn = sn;
        },
        checkCoupon: function () {
            return !(!this.couponId || !this.couponSn);
        },
        //获得附近司机
        getNearbyDrivers: function (lat, lng, map, callback) {
            var dragVer = map.DragVer;
            var that = this;
            var lambda = function () {
                $.post(that.nearbyDriver, {lat: lat, lng: lng}, function (json) {
                    map.GetVer++;
                    callback(json);
                }, 'json');
            };
            setTimeout(function (dragCount) {
                //减少与后台的交互，在1秒内没有拖动位置才去后台获取附近司机的位置
                if (dragCount == map.DragVer) {
                    lambda();
                }
            }, 1000, dragVer);
        },
        //预估费用
        costestimate: function (callback) {
            var that = this;
            var startPoint = that.startPoint;
            var endPoint = that.endPoint;
            var sn = that.couponSn; 
            var data = {
                startlat: startPoint.lat,
                startlng: startPoint.lng,
                endlat: endPoint.lat,
                endlng: endPoint.lng,
                bonus_sn: sn
            };
            $.post(that.orderCostestimate, data, function (json) {
                if (callback) callback(json);
            }, 'json');
        },
        //派单
        placeOrder: function (callback) {
            var that = this;
            var startP = this.startPoint;
            var endP = this.endPoint;
            var coupon_sn = this.couponSn,
                coupon_id = this.couponId,
                mobile = this.mobile;
            var data = {
                address: startP.address,
                lng: startP.lng,
                lat: startP.lat,
                bonus_sn: coupon_sn,
                coupon_id: coupon_id,
                daddress: endP.address,
                dlng: endP.lng,
                dlat: endP.lat,
                mobile: mobile,
                fee : that.fee,

            };
            $.post(that.orderCommit, data, function (json) {
                if (callback) callback(json);
            }, 'json');
        },
        //派单
        reserveOrder: function (callback) {
            var that = this;
            var startP = this.startPoint;
            var endP = this.endPoint;
            var coupon_sn = this.couponSn,
                coupon_id = this.couponId,
                mobile = this.mobile;
            var data = {
                address: startP.address,
                lng: startP.lng,
                lat: startP.lat,
                bonus_sn: coupon_sn,
                coupon_id: coupon_id,
                daddress: endP.address,
                dlng: endP.lng,
                dlat: endP.lat,
                mobile: mobile,
                fee : that.fee,
                begin:that.begin
            };
            $.post(that.orderReserveUrl, data, function (json) {
                if (callback) callback(json);
            }, 'json');
        },
        //拉取订单信息
        polling: function (callback, pollingCount) {
            var that = this;
            $.post(that.orderPolling, {
                booking_id: that.bookingId,
                booking_type: that.bookingType,
                polling_count: pollingCount
            }, function (json) {
                if (callback) callback(json, ++pollingCount);
            }, 'json');
        }
    };
    return m;
}

function searchPlace() {
    "use strict";
    var m = {
        url: '',
        getVer: 0,
        keyVer: 0,
        preVal: '',//上一次查的值
        region: '',
        init: function (url) {
            this.url = url;
        },
        setRegion: function (r) {
            this.region = r;
        },
        bind: function (obj, res) {//res结果显示区域
            var _this = this;
            obj.on("input propertychange", {res: res}, function (e) {
                var val = obj.val();
                if (!val.length) {
                    res.html('');
                } else if (val != _this.preVal) {
                    _this.preVal = val;
                    _this.keyVer++;
                    _this.search(val, _this.region, e.data.res);
                }
            });
        },
        search: function (q, r, box) {
            var _this = this;
            var lastKeyVer = _this.keyVer;
            var func = function (q, r) {
                $.post(_this.url, {q: q, r: r}, function (json) {
                    if (json.status === 1) {
                        box.html(json.data);
                    } else {
                        box.html('');
                    }
                }, 'json');
            };
            setTimeout(function (q, r, v) {
                if (v == _this.keyVer) {
                    func(q, r);
                }
            }, 350, q, r, lastKeyVer);
        }
    }
    return m;
}

