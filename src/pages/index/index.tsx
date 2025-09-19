import { useState } from 'react'
import { View, Map } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import './index.scss'
import { wgs84togcj02 } from '../../utils/util'

const MOCK_PATH = [
  [31.229361,121.446564],
  [31.227233,121.446967],
  [31.22532,121.447551],
  [31.224108,121.448037],
  [31.223252,121.448371],
  [31.222051,121.449121],
  [31.22097,121.450122],
  [31.219888,121.450733]
]

export default function Index() {
  const [latitude, setLatitude] = useState(39.90960456049752)
  const [longitude, setLongitude] = useState(116.3972282409668)
  const [markers, setMarkers] = useState<any[]>([])
  const [polyline, setPolyline] = useState<any[]>([])

  useLoad(() => {
    Taro.getLocation({
      type: 'wgs84',
      success: function (res) {
        const { lat, lon } = wgs84togcj02(res.latitude, res.longitude);
        setLatitude(lat)
        setLongitude(lon)
        const startPoint = MOCK_PATH[0]
        const endPoint = MOCK_PATH[MOCK_PATH.length - 1]
        setMarkers([
          { id: 1, latitude: lat, longitude: lon, callout: { content: '我在这里1', display: 'ALWAYS' } },
          { id: 2, latitude: startPoint[0], longitude: startPoint[1], callout: { content: '起点', display: 'ALWAYS' }, iconPath: 'https://cdn-icons-png.flaticon.com/128/447/447031.png', width: 20, height: 20 }, // 起点标记
          { id: 3, latitude: endPoint[0], longitude: endPoint[1], callout: { content: '终点', display: 'ALWAYS' }, iconPath: 'https://cdn-icons-png.flaticon.com/128/5359/5359315.png', width: 20, height: 20 } // 终点标记
        ])
      },
      fail: function (err) {
        console.error("获取定位失败", err)
        Taro.showToast({
          title: '获取定位失败',
          icon: 'none',
          duration: 2000
        })
      }
    })

    setPolyline([
      {
        points: MOCK_PATH.map(item => ({ latitude: item[0], longitude: item[1] })),
        color: '#FF0000DD',
        width: 4
      }
    ])
  })

  return (
    <View className='index'>
      <Map
        className='map-container'
        longitude={longitude}
        latitude={latitude}
        markers={markers}
        scale={14}
        showLocation
        polyline={polyline}
      />
    </View>
  )
}
