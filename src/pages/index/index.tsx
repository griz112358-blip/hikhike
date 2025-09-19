import { useState } from 'react'
import { View, Map } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { Feature, GeometryPoint, GeometryLineString } from '@myTypes/path.d'

import './index.scss'
import { wgs84togcj02, getDistance } from '../../utils/util'
import pathData from '../../assets/path1.json'

export default function Index() {
  const [latitude, setLatitude] = useState(39.90960456049752)
  const [longitude, setLongitude] = useState(116.3972282409668)
  const [markers, setMarkers] = useState<any[]>([])
  const [polyline, setPolyline] = useState<any[]>([])
  const [totalDistance, setTotalDistance] = useState(0)

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
    let calculatedDistance = 0;
    for (let i = 0; i < lineCoordinates.length - 1; i++) {
      const p1 = lineCoordinates[i];
      const p2 = lineCoordinates[i + 1];
      calculatedDistance += getDistance(p1[1], p1[0], p2[1], p2[0]);
    }
    setTotalDistance(parseFloat(calculatedDistance.toFixed(2))); // 保留两位小数
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
      <View className='distance-display'>
        总距离: {totalDistance} 米
      </View>
    </View>
  )
}
