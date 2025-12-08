// 树操作模块

// 添加树
function addTree() {
    const x = parseFloat(document.getElementById('treeX').value) || 0;
    const y = parseFloat(document.getElementById('treeY').value) || 0;
    const angle = parseFloat(document.getElementById('treeAngle').value) || 0;
    
    const tree = new ChristmasTree(x, y, angle);
    appState.trees.push(tree);
    
    ui.updateTreeList();
    collision.checkCollisions();
    window.drawing.draw();
    ui.showStatus('树已添加');
}

// 添加随机树
function addRandomTree() {
    const bounds = window.canvasInit.getTreeBounds();
    const range = bounds ? Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) + 2 : 10;
    
    const x = (Math.random() - 0.5) * range;
    const y = (Math.random() - 0.5) * range;
    const angle = Math.random() * 360;
    
    document.getElementById('treeX').value = x.toFixed(2);
    document.getElementById('treeY').value = y.toFixed(2);
    document.getElementById('treeAngle').value = angle.toFixed(2);
    
    addTree();
}

// 删除选中的树
function removeSelectedTree() {
    if (!appState.selectedTree) {
        ui.showStatus('请先选择一棵树', 'warning');
        return;
    }
    
    const index = appState.trees.indexOf(appState.selectedTree);
    appState.trees.splice(index, 1);
    
    // 清除选中状态并更新详细信息面板
    ui.closeDetails();
    
    ui.updateTreeList();
    collision.checkCollisions();
    window.drawing.draw();
    ui.showStatus('树已删除');
}

// 清空所有树
function clearAllTrees() {
    if (appState.trees.length === 0) {
        ui.showStatus('没有树可清除', 'warning');
        return;
    }
    
    if (confirm(`确定要删除所有 ${appState.trees.length} 棵树吗？`)) {
        appState.trees = [];
        appState.selectedTree = null;
        appState.collisions = [];
        
        // 清除详细信息面板
        ui.closeDetails();
        
        ui.updateTreeList();
        collision.checkCollisions();
        window.drawing.draw();
        ui.showStatus('所有树已清除');
    }
}

// 添加示例树
function addExampleTrees() {
    if (appState.trees.length === 0) {
        const exampleTrees = [
            [0, 0, 0],
            [1.5, 0, 45],
            [0, 1.5, 90],
            [-1.5, 0, 135],
            [0, -1.5, 180]
        ];
        
        exampleTrees.forEach(([x, y, angle]) => {
            document.getElementById('treeX').value = x;
            document.getElementById('treeY').value = y;
            document.getElementById('treeAngle').value = angle;
            addTree();
        });
        
        ui.showStatus('示例树已添加');
    }
}

// 新增：移动树到最远位置（使用自适应步长二分搜索）
function moveTreeToFarthest(tree, direction) {
    if (!tree) {
        ui.showStatus('请先选择一棵树', 'warning');
        return;
    }
    
    const MIN_STEP = 0.00000000001;   // 最小步长（精度）
    const INITIAL_STEP = 0.001;  // 初始步长
    
    // 获取包围盒边界
    const bounds = window.canvasInit.getTreeBounds();
    if (!bounds) {
        ui.showStatus('没有找到包围盒', 'error');
        return;
    }
    
    // 计算包围正方形
    const sideLength = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    const squareArea = sideLength * sideLength;
    const squareX = bounds.minX;
    const squareY = bounds.minY;
    
    // 确定方向向量
    let dirX = 0, dirY = 0;
    switch(direction) {
        case 'up': dirY = 1; break;    // Y+方向
        case 'down': dirY = -1; break; // Y-方向
        case 'left': dirX = -1; break; // X-方向
        case 'right': dirX = 1; break; // X+方向
    }
    
    // 保存树的原始位置
    const originalX = tree.center_x;
    const originalY = tree.center_y;
    
    // 计算到边界的最远可能距离（不考虑其他树）
    let maxDistanceToBoundary;
    if (dirX > 0) { // 向右移动
        maxDistanceToBoundary = (squareX + sideLength) - (tree.bounds.maxX);
    } else if (dirX < 0) { // 向左移动
        maxDistanceToBoundary = (tree.bounds.minX) - squareX;
    } else if (dirY > 0) { // 向上移动
        maxDistanceToBoundary = (squareY + sideLength) - (tree.bounds.maxY);
    } else if (dirY < 0) { // 向下移动
        maxDistanceToBoundary = (tree.bounds.minY) - squareY;
    }
    
    // 最大距离不能为负
    maxDistanceToBoundary = Math.max(0, maxDistanceToBoundary);
    
    // 自适应步长二分搜索算法
    let currentDistance = 0;
    let step = INITIAL_STEP;
    let lastValidDistance = 0;
    let iterations = 0;
    const MAX_ITERATIONS = 10000;
    
    while (step >= MIN_STEP && iterations < MAX_ITERATIONS) {
        iterations++;
        let collisionDetected = false;
        
        // 测试下一步是否会发生碰撞
        const testDistance = currentDistance + step;
        
        // 检查是否会超出边界
        if (testDistance > maxDistanceToBoundary) {
            step /= 2; // 超出边界，衰减步长
            continue;
        }
        
        // 临时移动树到测试位置
        const testX = originalX + dirX * testDistance;
        const testY = originalY + dirY * testDistance;
        tree.updatePosition(testX, testY);
        
        // 检查是否发生碰撞
        for (const otherTree of appState.trees) {
            if (otherTree === tree) continue;
            
            // 快速边界框检测
            if (!geometry.boundsIntersect(tree.bounds, otherTree.bounds, 0)) {
                continue;
            }
            
            // 精确的多边形相交检测
            if (geometry.doPolygonsIntersect(tree.polygon, otherTree.polygon)) {
                collisionDetected = true;
                break;
            }
        }
        
        // 恢复树的位置
        tree.updatePosition(originalX, originalY);
        
        if (collisionDetected) {
            // 发生碰撞，衰减步长
            step /= 2;
        } else {
            // 没有碰撞，前进并记录有效距离
            currentDistance = testDistance;
            lastValidDistance = currentDistance;
            
            // 如果没有碰撞，可以适当增大步长加速（但不能超过初始步长）
            step = Math.min(step * 1.5, INITIAL_STEP);
        }
    }
    
    // 直接使用最后有效的距离（不需要减去安全间隙，因为算法确保不会碰撞）
    const finalDistance = lastValidDistance;
    
    if (finalDistance > MIN_STEP) {
        // 执行移动
        const newX = originalX + dirX * finalDistance;
        const newY = originalY + dirY * finalDistance;
        tree.updatePosition(newX, newY);
        
        // 更新UI和状态
        ui.updateTreeList();
        collision.checkCollisions();
        window.drawing.draw();
        window.boundingBox.updateStats();
        
        // 更新详细信息面板
        if (appState.selectedTree === tree) {
            const xInput = document.getElementById('detailX');
            const yInput = document.getElementById('detailY');
            if (xInput) xInput.value = newX.toFixed(7);
            if (yInput) yInput.value = newY.toFixed(7);
        }
        
        ui.showStatus(`树已向${getDirectionName(direction)}移动 ${finalDistance.toFixed(4)} 单位`);
        return true;
    } else {
        ui.showStatus(`无法向${getDirectionName(direction)}移动`, 'warning');
        return false;
    }
}

// 辅助函数：获取方向名称
function getDirectionName(direction) {
    switch(direction) {
        case 'up': return '上';
        case 'down': return '下';
        case 'left': return '左';
        case 'right': return '右';
        default: return '';
    }
}

// 导出树操作函数
window.treeOperations = {
    addTree,
    addRandomTree,
    removeSelectedTree,
    clearAllTrees,
    addExampleTrees,
    moveTreeToFarthest
};