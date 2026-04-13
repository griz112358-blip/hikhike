const cloud = require('wx-server-sdk');

cloud.init({ env: 'cloud1-1g6k23o45e657c65' });
const db = cloud.database();
const routesCol = db.collection('routes');

exports.main = async (event, context) => {
  console.log('saveRoute 云函数被调用');

  const { name, points, length_km, source } = event;

  // 验证必填字段
  if (!name || !points || !Array.isArray(points) || points.length === 0) {
    return { 
      success: false, 
      error: '缺少必要参数: name, points' 
    };
  }

  // 验证轨迹点格式
  const validPoints = points.filter(p => 
    Array.isArray(p) && 
    p.length >= 2 && 
    !isNaN(p[0]) && 
    !isNaN(p[1])
  );

  if (validPoints.length === 0) {
    return { 
      success: false, 
      error: '轨迹点格式不正确' 
    };
  }

  try {
    // 存入数据库
    const addRes = await routesCol.add({
      data: {
        source: source || 'unknown',
        name: name,
        points: validPoints,
        length_km: length_km || 0,
        pointCount: validPoints.length,
        imported_at: new Date(),
        import_type: 'pc_script'
      }
    });

    console.log('路线入库成功，_id:', addRes._id);

    return {
      success: true,
      name: name,
      pointCount: validPoints.length,
      length_km: length_km || 0,
      recordId: addRes._id
    };

  } catch (err) {
    console.error('保存路线失败:', err);
    
    // 特殊处理集合不存在的错误
    if (err.errCode === -502005 || err.message.includes('collection not exists')) {
      return {
        success: false,
        error: '数据库集合 routes 不存在，请在云开发控制台手动创建集合'
      };
    }
    
    return { 
      success: false, 
      error: '保存路线失败: ' + err.message 
    };
  }
};
