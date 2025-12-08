// 包围盒相关函数

// 绘制包围盒
function drawBoundingBox(ctx, canvas) {
    const bounds = window.canvasInit.getTreeBounds();
    if (!bounds) return;

    const { minX, minY, maxX, maxY } = bounds;
    const sideLength = Math.max(maxX - minX, maxY - minY);
    const squareArea = sideLength * sideLength;
    
    // 计算包围正方形
    const squareX = minX;
    const squareY = minY;
    
    // 转换为屏幕坐标（Y坐标取反）
    const screenX = squareX * appState.zoom + appState.offsetX;
    const screenY = -squareY * appState.zoom + appState.offsetY; // Y坐标取反
    const screenSize = sideLength * appState.zoom;

    // 绘制包围正方形
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    // 注意：这里Y坐标需要调整，因为矩形绘制是从左上角开始
    ctx.strokeRect(screenX, screenY - screenSize, screenSize, screenSize);
    ctx.setLineDash([]);

    // 绘制包围盒信息 - 改为显示分数
    ctx.fillStyle = 'red';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    // 计算分数：正方形面积 / 树的棵树
    const treeCount = appState.trees.length;
    const score = squareArea / treeCount;
    ctx.fillText(`分数: ${score.toFixed(15)}`, screenX + 5, screenY - screenSize - 5);
}

// 更新统计信息（从ui.js移动过来的，因为与包围盒紧密相关）
function updateStats() {
    const sideLengthElement = document.getElementById('sideLength');
    const scoreElement = document.getElementById('score');
    
    const bounds = window.canvasInit.getTreeBounds();
    if (bounds) {
        const sideLength = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
        const squareArea = sideLength * sideLength;
        
        sideLengthElement.textContent = squareArea.toFixed(15);
        
        // 计算分数：正方形面积 / 树的棵树
        const score = squareArea / appState.trees.length;
        scoreElement.textContent = score.toFixed(15);
    } else {
        sideLengthElement.textContent = '0.000000000000000';
        scoreElement.textContent = '0.000000000000000';
    }
}

// 导出包围盒函数
window.boundingBox = {
    drawBoundingBox,
    updateStats
};