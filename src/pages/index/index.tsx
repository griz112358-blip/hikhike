import { useState } from 'react'
import { View, Map } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { Feature, GeometryPoint, GeometryLineString } from '@myTypes/path.d'

import './index.scss'
import { wgs84togcj02 } from '../../utils/util'
import * as pathData from '../../assets/path1.json'

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
        const startFeature = pathData.features.find(f => f.id === 'startPoint') as Feature;
        const endFeature = pathData.features.find(f => f.id === 'endPoint') as Feature;
        const startPoint = (startFeature.geometry as GeometryPoint).coordinates;
        const endPoint = (endFeature.geometry as GeometryPoint).coordinates;

        setMarkers([
          { id: 1, latitude: lat, longitude: lon, callout: { content: '我在这里1', display: 'ALWAYS' } },
          { id: 2, latitude: startPoint[1], longitude: startPoint[0], callout: { content: '起点', display: 'ALWAYS' }, iconPath: 'https://cdn-icons-png.flaticon.com/128/447/447031.png', width: 20, height: 20 }, // 起点标记
          { id: 3, latitude: endPoint[1], longitude: endPoint[0], callout: { content: '终点', display: 'ALWAYS' }, iconPath: 'https://cdn-icons-png.flaticon.com/128/5359/5359315.png', width: 20, height: 20 } // 终点标记
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
    const lineStringFeature = pathData.features.find(f => f.geometry.type === 'LineString') as Feature;
    const lineCoordinates = (lineStringFeature.geometry as GeometryLineString).coordinates;

    setPolyline([
      {
        points: lineCoordinates.map(item => ({ latitude: item[1], longitude: item[0] })),
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
