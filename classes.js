// 圣诞树类
class ChristmasTree {
    constructor(center_x = '0', center_y = '0', angle = '0') {
        this.id = Date.now() + Math.random();
        this.center_x = parseFloat(center_x);
        this.center_y = parseFloat(center_y);
        this.angle = parseFloat(angle);
        this.polygon = this.createPolygon();
        this.isBeingDragged = false; // 拖动状态
        this.isBeingRotated = false; // 新增：旋转状态
        this.bounds = null; // 新增：边界框缓存
        this.updateBounds(); // 初始计算边界框
    }

    createPolygon() {
        const trunk_w = 0.15;
        const trunk_h = 0.2;
        const base_w = 0.7;
        const mid_w = 0.4;
        const top_w = 0.25;
        const tip_y = 0.8;
        const tier_1_y = 0.5;
        const tier_2_y = 0.25;
        const base_y = 0.0;
        const trunk_bottom_y = -trunk_h;

        // 创建多边形点
        const points = [
            // 开始于树顶
            [0.0, tip_y],
            // 右侧 - 上层
            [top_w / 2, tier_1_y],
            [top_w / 4, tier_1_y],
            // 右侧 - 中层
            [mid_w / 2, tier_2_y],
            [mid_w / 4, tier_2_y],
            // 右侧 - 底层
            [base_w / 2, base_y],
            // 右侧树干
            [trunk_w / 2, base_y],
            [trunk_w / 2, trunk_bottom_y],
            // 左侧树干
            [-(trunk_w / 2), trunk_bottom_y],
            [-(trunk_w / 2), base_y],
            // 左侧 - 底层
            [-(base_w / 2), base_y],
            // 左侧 - 中层
            [-(mid_w / 4), tier_2_y],
            [-(mid_w / 2), tier_2_y],
            // 左侧 - 上层
            [-(top_w / 4), tier_1_y],
            [-(top_w / 2), tier_1_y],
        ];

        // 旋转多边形
        const angleRad = this.angle * Math.PI / 180;
        const rotatedPoints = points.map(([x, y]) => {
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            return [
                x * cos - y * sin,
                x * sin + y * cos
            ];
        });

        // 平移多边形
        return rotatedPoints.map(([x, y]) => [
            x + this.center_x,
            y + this.center_y
        ]);
    }

    // 新增：计算并缓存边界框
    updateBounds() {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        this.polygon.forEach(([x, y]) => {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        });
        
        this.bounds = { minX, minY, maxX, maxY };
        return this.bounds;
    }

    draw(ctx, scale, offsetX, offsetY, isSelected = false) {
        ctx.save();
        
        // 设置样式
        if (this.isBeingRotated) {
            // 旋转时的特殊样式
            ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.setLineDash([3, 3]);
        } else if (this.isBeingDragged) {
            // 拖动时的特殊样式
            ctx.fillStyle = 'rgba(255, 165, 0, 0.4)';
            ctx.strokeStyle = '#ff8c00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
        } else if (isSelected) {
            ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
            ctx.strokeStyle = '#ff416c';
            ctx.lineWidth = 2;
        } else {
            ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 1;
        }

        // 绘制多边形（Y坐标取反以实现数学坐标系）
        ctx.beginPath();
        const points = this.polygon;
        const firstPoint = points[0];
        const screenFirstX = firstPoint[0] * scale + offsetX;
        const screenFirstY = -firstPoint[1] * scale + offsetY; // Y坐标取反
        ctx.moveTo(screenFirstX, screenFirstY);

        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            const screenX = point[0] * scale + offsetX;
            const screenY = -point[1] * scale + offsetY; // Y坐标取反
            ctx.lineTo(screenX, screenY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 绘制树中心点
        const screenCenterX = this.center_x * scale + offsetX;
        const screenCenterY = -this.center_y * scale + offsetY; // Y坐标取反
        ctx.beginPath();
        ctx.arc(screenCenterX, screenCenterY, 3, 0, Math.PI * 2);
        
        if (this.isBeingRotated) {
            ctx.fillStyle = '#ffd700';
        } else if (this.isBeingDragged) {
            ctx.fillStyle = '#ff8c00';
        } else if (isSelected) {
            ctx.fillStyle = '#ff416c';
        } else {
            ctx.fillStyle = '#2c3e50';
        }
        ctx.fill();

        // 如果是被选中的树，绘制旋转控制点
        if (isSelected) {
            // 绘制旋转控制手柄（在树顶）
            const topPoint = points[0];
            const screenTopX = topPoint[0] * scale + offsetX;
            const screenTopY = -topPoint[1] * scale + offsetY;
            
            ctx.beginPath();
            ctx.arc(screenTopX, screenTopY, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd700';
            ctx.fill();
            ctx.strokeStyle = '#ff8c00';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 绘制从中心到顶点的线
            ctx.beginPath();
            ctx.moveTo(screenCenterX, screenCenterY);
            ctx.lineTo(screenTopX, screenTopY);
            ctx.strokeStyle = 'rgba(255, 140, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.stroke();
            
            // 如果是旋转状态，绘制角度指示器
            if (this.isBeingRotated) {
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.arc(screenCenterX, screenCenterY, 20, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // 显示当前角度
                ctx.fillStyle = '#ff8c00';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${this.angle.toFixed(1)}°`, screenCenterX, screenCenterY - 25);
            }
        }

        ctx.restore();
    }

    // 更新位置并重新计算多边形
    updatePosition(newX, newY) {
        // 计算位置变化量
        const deltaX = newX - this.center_x;
        const deltaY = newY - this.center_y;
        
        // 更新中心点
        this.center_x = newX;
        this.center_y = newY;
        
        // 更新多边形所有点的位置
        this.polygon = this.polygon.map(([x, y]) => [
            x + deltaX,
            y + deltaY
        ]);
        
        // 更新边界框
        this.updateBounds();
    }
    
    // 更新角度并重新计算多边形
    updateAngle(newAngle) {
        this.angle = newAngle;
        this.polygon = this.createPolygon();
        this.updateBounds(); // 更新边界框
    }

    // 判断点是否在旋转控制手柄上
    isPointOnRotationHandle(pointX, pointY, scale, offsetX, offsetY) {
        const screenTopX = this.polygon[0][0] * scale + offsetX;
        const screenTopY = -this.polygon[0][1] * scale + offsetY;
        
        const distance = Math.sqrt(
            Math.pow(pointX - screenTopX, 2) + 
            Math.pow(pointY - screenTopY, 2)
        );
        
        return distance <= 10; // 手柄半径为10像素
    }
}

// 应用状态类
class AppState {
    constructor() {
        this.trees = [];
        this.selectedTree = null;
        this.collisions = [];
        this.zoom = 50;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDraggingView = false;
        this.isDraggingTree = false;
        this.isRotatingTree = false; // 新增：旋转树状态
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.originalOffsetX = 0;
        this.originalOffsetY = 0;
        this.dragStartWorldX = 0;
        this.dragStartWorldY = 0;
        this.draggedTree = null;
        this.showGrid = true;
        this.dragStartAngle = 0; // 新增：旋转起始角度
        this.spatialGrid = null; // 新增：空间网格
    }
}

// 导出类
window.ChristmasTree = ChristmasTree;
window.AppState = AppState;