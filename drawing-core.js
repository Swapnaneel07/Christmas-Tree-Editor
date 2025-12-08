// 核心绘制函数

// 主绘制函数
function draw() {
    const canvas = document.getElementById('treeCanvas');
    const ctx = canvas.getContext('2d');
    
    // 检查画布尺寸是否为0
    if (canvas.width === 0 || canvas.height === 0) {
        return; // 防止在画布尺寸为0时绘制
    }
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    if (appState.showGrid) {
        window.gridAxes.drawGrid(ctx, canvas);
    }

    // 绘制坐标轴
    window.gridAxes.drawAxes(ctx, canvas);

    // 绘制所有树
    appState.trees.forEach(tree => {
        tree.draw(ctx, appState.zoom, appState.offsetX, appState.offsetY, 
                 appState.selectedTree === tree);
    });

    // 绘制包围盒
    if (appState.trees.length > 0) {
        window.boundingBox.drawBoundingBox(ctx, canvas);
    }
}

// 切换网格显示
function toggleGrid() {
    appState.showGrid = !appState.showGrid;
    draw();
}

// 导出核心绘制函数
window.drawing = {
    draw,
    toggleGrid
};