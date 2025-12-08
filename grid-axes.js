// 网格和坐标轴绘制

// 绘制网格
function drawGrid(ctx, canvas) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 0.5;
    
    const gridSize = 1 * appState.zoom;
    
    // 计算网格线的起点和终点
    const startX = -Math.floor(appState.offsetX / gridSize) * gridSize;
    const startY = -Math.floor(appState.offsetY / gridSize) * gridSize;
    
    const endX = canvas.width;
    const endY = canvas.height;
    
    // 绘制垂直线
    for (let x = startX; x < endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = startY; y < endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// 绘制坐标轴
function drawAxes(ctx, canvas) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    
    // X轴（水平线）
    const xAxisY = appState.offsetY;
    ctx.beginPath();
    ctx.moveTo(0, xAxisY);
    ctx.lineTo(canvas.width, xAxisY);
    ctx.stroke();
    
    // Y轴（垂直线）
    const yAxisX = appState.offsetX;
    ctx.beginPath();
    ctx.moveTo(yAxisX, 0);
    ctx.lineTo(yAxisX, canvas.height);
    ctx.stroke();
    
    // 坐标轴标签
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    // X轴标签
    const worldX = (-(appState.offsetX - canvas.width/2) / appState.zoom).toFixed(2);
    ctx.fillText(`X: ${worldX}`, 10, xAxisY - 5);
    
    // Y轴标签（注意Y坐标取反）
    const worldY = ((appState.offsetY - canvas.height/2) / appState.zoom).toFixed(2);
    ctx.fillText(`Y: ${worldY}`, yAxisX + 5, 20);
}

// 导出网格和坐标轴函数
window.gridAxes = {
    drawGrid,
    drawAxes
};