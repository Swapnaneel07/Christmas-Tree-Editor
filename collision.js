// 碰撞检测模块 - 重构版

// 碰撞检测主函数 - 使用空间网格优化
function checkCollisions() {
    appState.collisions = [];
    const trees = appState.trees;
    
    if (trees.length <= 1) {
        updateCollisionDisplay();
        window.boundingBox.updateStats();
        return;
    }
    
    // 方法1：使用空间网格快速检测
    const collisions1 = checkCollisionsWithSpatialGrid();
    
    // 方法2：备用方法（如果网格检测有问题）
    const collisions2 = checkCollisionsBruteForce();
    
    // 使用检测结果（优先使用网格结果）
    appState.collisions = collisions1.length > 0 ? collisions1 : collisions2;

    updateCollisionDisplay();
    window.boundingBox.updateStats(); // 更新统计信息
}

// 使用空间网格的碰撞检测
function checkCollisionsWithSpatialGrid() {
    const trees = appState.trees;
    const collisions = [];
    
    // 初始化或更新空间网格
    if (!appState.spatialGrid) {
        appState.spatialGrid = new geometry.SpatialGrid(1.0); // 单元格大小设为1.0
    }
    
    // 清空并重新填充网格
    appState.spatialGrid.clear();
    trees.forEach((tree, index) => {
        appState.spatialGrid.insertTree(index, tree.bounds);
    });
    
    // 获取潜在的碰撞对
    const potentialPairs = appState.spatialGrid.findPotentialCollisions();
    
    // 精确检测每个潜在碰撞对
    potentialPairs.forEach(pair => {
        const tree1 = trees[pair.tree1];
        const tree2 = trees[pair.tree2];
        
        // 1. 快速边界框检测
        if (!geometry.boundsIntersect(tree1.bounds, tree2.bounds)) {
            return; // 边界框不相交，肯定不碰撞
        }
        
        // 2. 精确的多边形相交检测
        if (geometry.doPolygonsIntersect(tree1.polygon, tree2.polygon)) {
            const area = geometry.calculateOverlapArea(tree1.polygon, tree2.polygon);
            const centerDist = geometry.calculateCenterDistance(
                tree1.center_x, tree1.center_y,
                tree2.center_x, tree2.center_y
            );

            collisions.push({
                tree1: pair.tree1,
                tree2: pair.tree2,
                tree1Obj: tree1,
                tree2Obj: tree2,
                overlapArea: area,
                centerDistance: centerDist
            });
        }
    });
    
    return collisions;
}

// 备用方法：暴力检测（用于调试和验证）
function checkCollisionsBruteForce() {
    const trees = appState.trees;
    const collisions = [];
    
    for (let i = 0; i < trees.length; i++) {
        for (let j = i + 1; j < trees.length; j++) {
            // 快速边界框检测
            if (!geometry.boundsIntersect(trees[i].bounds, trees[j].bounds)) {
                continue;
            }
            
            // 精确检测
            if (geometry.doPolygonsIntersect(trees[i].polygon, trees[j].polygon)) {
                const area = geometry.calculateOverlapArea(trees[i].polygon, trees[j].polygon);
                const centerDist = geometry.calculateCenterDistance(
                    trees[i].center_x, trees[i].center_y,
                    trees[j].center_x, trees[j].center_y
                );

                collisions.push({
                    tree1: i,
                    tree2: j,
                    tree1Obj: trees[i],
                    tree2Obj: trees[j],
                    overlapArea: area,
                    centerDistance: centerDist
                });
            }
        }
    }
    
    return collisions;
}

// 更新碰撞显示
function updateCollisionDisplay() {
    const collisionCountElement = document.getElementById('collisionCount');
    const collisionSectionElement = document.getElementById('collisionSection');
    const collisionInfoElement = document.getElementById('collisionInfo');
    
    collisionCountElement.textContent = appState.collisions.length;
    
    if (appState.collisions.length > 0) {
        collisionSectionElement.style.display = 'block';
        
        let html = '<div class="collision-info">';
        appState.collisions.forEach((collision, index) => {
            html += `
                <div style="margin-bottom: 10px; padding: 8px; background: #ffebee; border-radius: 4px;">
                    <strong>碰撞 ${index + 1}:</strong> 树 ${collision.tree1 + 1} 和 树 ${collision.tree2 + 1}<br>
                    <small>中心距离: ${collision.centerDistance.toFixed(4)}</small><br>
                    <small>重叠面积: ${collision.overlapArea.toFixed(12)}</small>
                </div>
            `;
        });
        html += '</div>';
        collisionInfoElement.innerHTML = html;
    } else {
        collisionSectionElement.style.display = 'none';
    }
}

// 导出碰撞检测函数
window.collision = {
    checkCollisions,
    checkCollisionsWithSpatialGrid,
    checkCollisionsBruteForce,
    updateCollisionDisplay
};