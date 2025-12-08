// 几何计算函数库 - 重构版

// 获取多边形边界框
function getPolygonBounds(polygon) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    polygon.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    });
    
    return { minX, minY, maxX, maxY };
}

// 判断点是否在多边形内（射线法）
function isPointInPolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        
        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
    }
    
    return inside;
}

// 边界框相交检测（快速排除）
function boundsIntersect(boundsA, boundsB, tolerance = 0.001) {
    return !(boundsA.maxX < boundsB.minX - tolerance ||
             boundsB.maxX < boundsA.minX - tolerance ||
             boundsA.maxY < boundsB.minY - tolerance ||
             boundsB.maxY < boundsA.minY - tolerance);
}

// 判断两线段是否相交
function segmentsIntersect(seg1, seg2) {
    const [x1, y1] = seg1[0];
    const [x2, y2] = seg1[1];
    const [x3, y3] = seg2[0];
    const [x4, y4] = seg2[1];
    
    // 计算方向
    const d = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    
    // 平行或共线
    if (Math.abs(d) < 1e-10) return false;
    
    // 计算交点参数
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / d;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / d;
    
    // 检查是否在线段上
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

// 判断多边形是否相交（基于边相交）
function doPolygonsIntersect(polyA, polyB) {
    // 1. 快速边界框检测
    const boundsA = getPolygonBounds(polyA);
    const boundsB = getPolygonBounds(polyB);
    
    if (!boundsIntersect(boundsA, boundsB)) {
        return false;
    }
    
    // 2. 边相交检测
    for (let i = 0; i < polyA.length; i++) {
        const nextI = (i + 1) % polyA.length;
        const edgeA = [polyA[i], polyA[nextI]];
        
        for (let j = 0; j < polyB.length; j++) {
            const nextJ = (j + 1) % polyB.length;
            const edgeB = [polyB[j], polyB[nextJ]];
            
            if (segmentsIntersect(edgeA, edgeB)) {
                return true;
            }
        }
    }
    
    // 3. 如果一个多边形完全在另一个内部
    if (isPointInPolygon(polyA[0], polyB)) {
        return true;
    }
    
    if (isPointInPolygon(polyB[0], polyA)) {
        return true;
    }
    
    return false;
}

// 计算重叠面积（近似 - 使用边界框重叠）
function calculateOverlapArea(polyA, polyB) {
    const boundsA = getPolygonBounds(polyA);
    const boundsB = getPolygonBounds(polyB);
    
    const overlapX = Math.max(0, 
        Math.min(boundsA.maxX, boundsB.maxX) - Math.max(boundsA.minX, boundsB.minX));
    const overlapY = Math.max(0,
        Math.min(boundsA.maxY, boundsB.maxY) - Math.max(boundsA.minY, boundsB.minY));
    
    return overlapX * overlapY;
}

// 计算中心距离
function calculateCenterDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

// 新增：计算多边形的包围圆半径
function getBoundingCircleRadius(polygon) {
    // 简单实现：找到距离中心最远的顶点
    // 首先计算多边形的中心点
    let sumX = 0, sumY = 0;
    polygon.forEach(([x, y]) => {
        sumX += x;
        sumY += y;
    });
    const centerX = sumX / polygon.length;
    const centerY = sumY / polygon.length;
    
    // 找到最大距离
    let maxDistance = 0;
    polygon.forEach(([x, y]) => {
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        maxDistance = Math.max(maxDistance, distance);
    });
    
    return maxDistance;
}

// 新增：计算点到直线的距离
function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
        param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
}

// 新增：射线与线段的交点计算
function raySegmentIntersection(rayOriginX, rayOriginY, rayDirX, rayDirY, 
                               segX1, segY1, segX2, segY2) {
    const rX = segX2 - segX1;
    const rY = segY2 - segY1;
    const sX = rayDirX;
    const sY = rayDirY;
    
    const denominator = rX * sY - rY * sX;
    
    if (Math.abs(denominator) < 1e-10) {
        return null; // 平行
    }
    
    const t = ((rayOriginX - segX1) * sY - (rayOriginY - segY1) * sX) / denominator;
    const u = ((rayOriginX - segX1) * rY - (rayOriginY - segY1) * rX) / denominator;
    
    if (t >= 0 && t <= 1 && u >= 0) {
        return {
            x: segX1 + t * rX,
            y: segY1 + t * rY,
            distance: u
        };
    }
    
    return null;
}

// 新增：计算射线与多边形的最近交点
function rayPolygonIntersection(rayOriginX, rayOriginY, rayDirX, rayDirY, polygon) {
    let closestIntersection = null;
    
    for (let i = 0; i < polygon.length; i++) {
        const [x1, y1] = polygon[i];
        const [x2, y2] = polygon[(i + 1) % polygon.length];
        
        const intersection = raySegmentIntersection(
            rayOriginX, rayOriginY, rayDirX, rayDirY,
            x1, y1, x2, y2
        );
        
        if (intersection && 
            (!closestIntersection || intersection.distance < closestIntersection.distance)) {
            closestIntersection = intersection;
        }
    }
    
    return closestIntersection;
}

// 空间划分优化：构建简单网格
class SpatialGrid {
    constructor(cellSize = 1.0) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }
    
    // 将坐标转换为网格键
    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }
    
    // 插入树的边界框
    insertTree(treeId, bounds) {
        const cells = this.getCellsForBounds(bounds);
        cells.forEach(cellKey => {
            if (!this.grid.has(cellKey)) {
                this.grid.set(cellKey, new Set());
            }
            this.grid.get(cellKey).add(treeId);
        });
    }
    
    // 清空网格
    clear() {
        this.grid.clear();
    }
    
    // 获取边界框覆盖的所有单元格
    getCellsForBounds(bounds) {
        const cells = new Set();
        
        const startCellX = Math.floor(bounds.minX / this.cellSize);
        const startCellY = Math.floor(bounds.minY / this.cellSize);
        const endCellX = Math.floor(bounds.maxX / this.cellSize);
        const endCellY = Math.floor(bounds.maxY / this.cellSize);
        
        for (let x = startCellX; x <= endCellX; x++) {
            for (let y = startCellY; y <= endCellY; y++) {
                cells.add(`${x},${y}`);
            }
        }
        
        return cells;
    }
    
    // 查找可能的碰撞对
    findPotentialCollisions() {
        const potentialPairs = new Set();
        
        // 检查每个单元格内的树
        for (const [cellKey, treeIds] of this.grid) {
            const trees = Array.from(treeIds);
            
            // 同一单元格内的树对
            for (let i = 0; i < trees.length; i++) {
                for (let j = i + 1; j < trees.length; j++) {
                    const pair = trees[i] < trees[j] ? 
                        `${trees[i]}-${trees[j]}` : 
                        `${trees[j]}-${trees[i]}`;
                    potentialPairs.add(pair);
                }
            }
        }
        
        return Array.from(potentialPairs).map(pair => {
            const [id1, id2] = pair.split('-').map(Number);
            return { tree1: id1, tree2: id2 };
        });
    }
}

// 导出几何函数
window.geometry = {
    getPolygonBounds,
    isPointInPolygon,
    doPolygonsIntersect,
    calculateOverlapArea,
    calculateCenterDistance,
    boundsIntersect,
    segmentsIntersect,
    getBoundingCircleRadius,
    pointToLineDistance,
    raySegmentIntersection,
    rayPolygonIntersection,
    SpatialGrid
};