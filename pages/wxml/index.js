// pages/wxml/index.js
var app = getApp()
var temp = []
var string_temp=""
var serviceId = "00001802-0000-1000-8000-00805F9B34FB"
var characteristicIdRead = "00002ABC-0000-1000-8000-00805F9B34FB"
var characteristicIdWrite = "00002A06-0000-1000-8000-00805F9B34FB"
 
Page({
  data: {
    isbluetoothready: false,
    defaultSize: 'default',
    primarySize: 'default',
    warnSize: 'default',
    disabled: false,
    plain: false,
    loading: false,
    searchingstatus: false,
    receivedata: '666',
    onreceiving: false,
    id_text: string_temp,
    list: [],
    receive_data:'none  ',
    interval: '',
    bleName: 'qeebike_3301000201'
  },
  onLoad: function () {
 
  },
  open_BLE: function () {
    var that = this
 
    that.setData({
      isbluetoothready: !that.data.isbluetoothready,
    })
    if (that.data.isbluetoothready) {
      //开启蓝牙模块并初始化
      wx.openBluetoothAdapter({
        success: function (res) {
           //检查蓝牙模块是否初始化成功
      wx.getBluetoothAdapterState({
        success: function (res) {
            console.log('res is ' + JSON.stringify(res));
          var available = res.available
          if (!available) {
            wx.showToast({
              title: '蓝牙初始化失败',
              icon: 'loading',
              duration: 2000
            })
          }
          else {
            wx.showToast({
              title: '蓝牙初始化成功',
              icon: 'success',
              duration: 2000
            })
          }
        }
      })
      //检查蓝牙模块是否初始化成功
        },
        fail: function (res) {
          wx.showModal({
            title: '提示',
            content: '请检查手机蓝牙是否打开',
          })
        }
      })
      //开启蓝牙模块并初始化

    }
    else{
      wx.closeBLEConnection({
        deviceId: that.data.connectedDeviceId,
        complete: function (res) {
          that.setData({
            deviceconnected: false,
            connectedDeviceId: ""
          })
          wx.showToast({
            title: '蓝牙连接断开',
            icon: 'success',
            duration: 2000
          })
        }
      })
      setTimeout(function () {
        that.setData({
          list: []
        })
        //释放蓝牙适配器
        wx.closeBluetoothAdapter({
          success: function (res) {
            that.setData({
              isbluetoothready: false,
              deviceconnected: false,
              devices: [],
              searchingstatus: false,
              receivedata: ''
            })
            wx.showToast({
              title: '蓝牙适配器释放',
              icon: 'success',
              duration: 2000
            })
          },
          fail: function (res) {
 
          }
        })
        //释放蓝牙适配器
      }, 1000)
    }
  },
 
  search_BLE: function () {
      this.startInterval();
    temp = []
    var that = this
    if (!that.data.searchingstatus) {
      var that = this
      //开始搜索附近蓝牙设备
      wx.startBluetoothDevicesDiscovery({
        success: function (res) {
          wx.showToast({
            title: '开始搜索BLE',
            icon: 'loading',
            duration: 2000
          })
          that.setData({
            searchingstatus: !that.data.searchingstatus
          })
        },
      })
      //开始搜索附近蓝牙设备
    } else {
        this.endInterval()
      //停止搜索附近蓝牙设备
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          wx.showToast({
            title: '停止搜索BLE',
            icon: 'success',
            duration: 2000
          })
          that.setData({
            searchingstatus: !that.data.searchingstatus
          })
        }
      })
    }
  },
 
  connectTO: function (e) {
      console.log("connectTO e is " + JSON.stringify(e));
    var that = this
      wx.showLoading({
        title: '连接蓝牙设备中...',
      })
      wx.createBLEConnection({
        deviceId: e.currentTarget.id,
        success: function (res) {
            console.log("connectTO res is " + JSON.stringify(res));

          wx.hideLoading()
          wx.showToast({
            title: '连接成功',
            icon: 'success',
            duration: 1000
          })
          that.setData({
            deviceconnected: true,
            connectedDeviceId: e.currentTarget.id
          })
          // 启用 notify 功能
          wx.notifyBLECharacteristicValueChanged({
            state: true, 
            deviceId: that.data.connectedDeviceId,
            serviceId: serviceId,
            characteristicId: characteristicIdRead,
            success: function (res) {
 
            }
          })
          // 启用 notify 功能
          // ArrayBuffer转为16进制数
          function ab2hex(buffer) {
            var hexArr = Array.prototype.map.call(
              new Uint8Array(buffer),
              function (bit) {
                return ('00' + bit.toString(16)).slice(-2)
              }
            )
            return hexArr.join('');
          }
          // 16进制数转ASCLL码
          function hexCharCodeToStr(hexCharCodeStr) {
            var trimedStr = hexCharCodeStr.trim();
            var rawStr = trimedStr.substr(0, 2).toLowerCase() === "0x" ? trimedStr.substr(2) : trimedStr;
            var len = rawStr.length;
            var curCharCode;
            var resultStr = [];
            for (var i = 0; i < len; i = i + 2) {
              curCharCode = parseInt(rawStr.substr(i, 2), 16);
              resultStr.push(String.fromCharCode(curCharCode));
            }
            return resultStr.join("");
          }
          //监听回调，接收数据
          wx.onBLECharacteristicValueChange(function (characteristic) {
            var hex = ab2hex(characteristic.value)
            that.setData({
              receive_data: hexCharCodeToStr(hex)
            })
          })
        },
        fail: function (res) {
          wx.hideLoading()
          wx.showToast({
            title: '连接设备失败',
            icon: 'success',
            duration: 1000
          })
          that.setData({
            connected: false
          })
        }
      })
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
 
        }
      })
  },
 
  formSubmit: function (e) {
    var senddata = e.detail.value.senddata;
    var that = this
    let buffer = new ArrayBuffer(senddata.length)
    let dataView = new DataView(buffer)
    for (var i = 0; i < senddata.length; i++) {
      dataView.setUint8(i, senddata.charAt(i).charCodeAt())
    }

    console.log("formSubmit that.data.connectedDeviceId is " + that.data.connectedDeviceId);

    

    wx.getBLEDeviceServices({
      deviceId: that.data.connectedDeviceId,
      success: function(res) {
        console.log("getBLEDeviceServices is res " + JSON.stringify(res));

        wx.getBLEDeviceCharacteristics({
            deviceId: that.data.connectedDeviceId,
            serviceId: serviceId,
            success: function(res) {
                console.log("getBLEDeviceCharacteristics res is " + JSON.stringify(res));

                wx.writeBLECharacteristicValue({
                    deviceId: that.data.connectedDeviceId,
                    serviceId: serviceId,
                    characteristicId: characteristicIdWrite,
                    value: buffer,
                    success: function (res) {
                      wx.showToast({
                        title: '发送成功',
                        icon: 'success',
                        duration: 2000
                      })
                    },
                    fail: function(res) {
                        console.log("writeBLECharacteristicValue serviceId is " + serviceId);
                        console.log("writeBLECharacteristicValue res is " + JSON.stringify(res));
                    }
                  })
            }
          })

        
      },
      fail: function(e) {
          console.log("getBLEDeviceServices is e " + JSON.stringify(e));
      }
    })

  },
 
  receiveMessages: function () {
    var that = this;
    wx.readBLECharacteristicValue({
      deviceId: that.data.connectedDeviceId,
      serviceId: serviceId,
      characteristicId: characteristicIdRead,
      success: function (res) {
          console.log("receiveMessages is " + JSON.stringify(res));
      }
    })
  },

  startInterval : function() {
    var that = this;
    that.data.interval = setInterval(
        function() {
        //获取发现的蓝牙设备
        wx.getBluetoothDevices({
            success: function (res) {
                for (const index in res.devices) {
                    if (res.devices.hasOwnProperty(index)) {
                        console.log("element is " + JSON.stringify(element));
                        const element = res.devices[index];
                        if (element.name == that.bleName) {
                            that.setData({searchingstatus: true})
                            this.connectTO(element.deviceId)
                            break
                        }
                    }
                }
            }
          })
          //获取发现的蓝牙设备
        }
    , 1000);
  },

  endInterval: function() {
      var that = this;
      that.clearInterval(that.data.interval);
  }
 
})
