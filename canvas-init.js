// 画布初始化和尺寸管理

// 初始化画布
function initCanvas() {
    const canvas = document.getElementById('treeCanvas');
    const ctx = canvas.getContext('2d');
    
    // 更新画布尺寸函数
    const updateCanvasSize = () => {
        const container = canvas.parentElement;
        const computedStyle = window.getComputedStyle(container);
        
        // 获取容器实际可用尺寸
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // 设置画布尺寸（使用实际像素值）
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        
        // 保持画布显示尺寸与容器一致
        canvas.style.width = containerWidth + 'px';
        canvas.style.height = containerHeight + 'px';
    };
    
    // 初始更新
    updateCanvasSize();
    
    // 监听容器大小变化
    const resizeObserver = new ResizeObserver(() => {
        updateCanvasSize();
        window.drawing.draw(); // 重绘
    });
    
    // 观察画布容器
    resizeObserver.observe(canvas.parentElement);
    
    // 保存观察器以便清理
    canvas._resizeObserver = resizeObserver;
    
    // 初始化偏移量，使坐标系原点在画布中心
    if (appState.offsetX === 0 && appState.offsetY === 0) {
        appState.offsetX = canvas.width / 2;
        appState.offsetY = canvas.height / 2;
    }
    
    window.drawing.draw();
}

// 查找点击位置的树（修复坐标转换，Y坐标取反）
function findTreeAtPoint(screenX, screenY) {
    // 将屏幕坐标转换为世界坐标（Y坐标取反）
    const worldX = (screenX - appState.offsetX) / appState.zoom;
    const worldY = -(screenY - appState.offsetY) / appState.zoom; // Y坐标取反
    
    // 从后往前检查，这样后绘制的树（在上层的树）会先被检测到
    for (let i = appState.trees.length - 1; i >= 0; i--) {
        const tree = appState.trees[i];
        if (geometry.isPointInPolygon([worldX, worldY], tree.polygon)) {
            return tree;
        }
    }
    return null;
}

// 获取树边界
function getTreeBounds() {
    if (appState.trees.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    appState.trees.forEach(tree => {
        tree.polygon.forEach(([x, y]) => {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        });
    });

    return { minX, minY, maxX, maxY };
}

// 居中显示
function centerView() {
    const canvas = document.getElementById('treeCanvas');
    const bounds = getTreeBounds();
    
    if (bounds) {
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        
        // 计算新的偏移量，使中心点位于画布中心
        appState.offsetX = canvas.width / 2 - centerX * appState.zoom;
        appState.offsetY = canvas.height / 2 - (-centerY) * appState.zoom; // Y坐标取反
    } else {
        appState.offsetX = canvas.width / 2;
        appState.offsetY = canvas.height / 2;
    }
    
    window.drawing.draw();
}

// 缩放控制
function zoomIn() {
    appState.zoom *= 1.2;
    window.drawing.draw();
}

function zoomOut() {
    appState.zoom /= 1.2;
    window.drawing.draw();
}

// 清理函数（可选，用于页面卸载时清理观察器）
function cleanupCanvas() {
    const canvas = document.getElementById('treeCanvas');
    if (canvas && canvas._resizeObserver) {
        canvas._resizeObserver.disconnect();
    }
}

// 导出画布初始化函数
window.canvasInit = {
    initCanvas,
    findTreeAtPoint,
    getTreeBounds,
    centerView,
    zoomIn,
    zoomOut,
    cleanupCanvas
};