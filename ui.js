// 界面更新模块

// 更新树列表
function updateTreeList() {
    const treeListElement = document.getElementById('treeList');
    const treeCountElement = document.getElementById('treeCount');
    
    treeListElement.innerHTML = '';
    treeCountElement.textContent = appState.trees.length;
    
    appState.trees.forEach((tree, index) => {
        const treeItem = document.createElement('div');
        treeItem.className = 'tree-item';
        if (tree === appState.selectedTree) {
            treeItem.classList.add('selected');
        }
        
        treeItem.innerHTML = `
            <strong>树 ${index + 1}</strong>
            <div class="tree-info">
                <div>X: ${tree.center_x.toFixed(3)}</div>
                <div>Y: ${tree.center_y.toFixed(3)}</div>
                <div>角度: ${tree.angle.toFixed(1)}°</div>
                <div>ID: ${tree.id.toString().slice(-4)}</div>
            </div>
        `;
        
        treeItem.onclick = (e) => {
            e.stopPropagation();
            selectTree(tree);
        };
        
        treeListElement.appendChild(treeItem);
    });
}

// 选择树
function selectTree(tree) {
    const selectedTreeElement = document.getElementById('selectedTree');
    const detailsPanel = document.getElementById('treeDetails');
    
    appState.selectedTree = tree;
    selectedTreeElement.textContent = `树 ${appState.trees.indexOf(tree) + 1}`;
    updateTreeList();
    
    // 更新详细信息面板内容 - 改为可编辑的输入框
    detailsPanel.innerHTML = `
        <div class="form-group">
            <label>X坐标:</label>
            <input type="number" id="detailX" step="0.0000001" value="${tree.center_x}" class="detail-input">
        </div>
        <div class="form-group">
            <label>Y坐标:</label>
            <input type="number" id="detailY" step="0.0000001" value="${tree.center_y}" class="detail-input">
        </div>
        <div class="form-group">
            <label>角度(°):</label>
            <input type="number" id="detailAngle" step="0.0000001" value="${tree.angle}" class="detail-input">
        </div>
        <p><strong>ID:</strong> ${tree.id}</p>
        <p><strong>树编号:</strong> ${appState.trees.indexOf(tree) + 1}</p>
        <p style="color: #ff8c00; font-size: 12px; margin-top: 10px;">
            💡 提示：<br>
            1. 拖动树顶的黄色圆点可以旋转树<br>
            2. 使用键盘方向键可以向对应方向移动到最远位置<br>
            3. 按Delete键可以删除选中的树
        </p>
        <div class="btn-group" style="margin-top: 15px;">
            <button class="btn btn-danger" onclick="removeSelectedTree()">🗑️ 删除</button>
        </div>
    `;
    
    // 为输入框添加事件监听
    setTimeout(() => {
        document.getElementById('detailX').addEventListener('change', updateTreeFromDetails);
        document.getElementById('detailY').addEventListener('change', updateTreeFromDetails);
        document.getElementById('detailAngle').addEventListener('change', updateTreeFromDetails);
        
        // 为输入框添加input事件，实现更实时的更新
        document.getElementById('detailX').addEventListener('input', updateTreeFromDetails);
        document.getElementById('detailY').addEventListener('input', updateTreeFromDetails);
        document.getElementById('detailAngle').addEventListener('input', updateTreeFromDetails);
    }, 0);
    
    drawing.draw();
}

// 从详细信息面板更新树
function updateTreeFromDetails() {
    if (!appState.selectedTree) return;
    
    const xInput = document.getElementById('detailX');
    const yInput = document.getElementById('detailY');
    const angleInput = document.getElementById('detailAngle');
    
    if (!xInput || !yInput || !angleInput) return;
    
    const newX = parseFloat(xInput.value) || 0;
    const newY = parseFloat(yInput.value) || 0;
    const newAngle = parseFloat(angleInput.value) || 0;
    
    // 更新选中的树
    appState.selectedTree.center_x = newX;
    appState.selectedTree.center_y = newY;
    appState.selectedTree.angle = newAngle;
    
    // 重新创建多边形
    appState.selectedTree.polygon = appState.selectedTree.createPolygon();
    
    ui.updateTreeList();
    collision.checkCollisions();
    drawing.draw();
    window.boundingBox.updateStats();
}

// 关闭详细信息（当取消选中时）
function closeDetails() {
    const selectedTreeElement = document.getElementById('selectedTree');
    const detailsPanel = document.getElementById('treeDetails');
    
    appState.selectedTree = null;
    selectedTreeElement.textContent = '无';
    detailsPanel.innerHTML = `
        <p style="color: #666; text-align: center; padding: 20px;">
            点击树以查看详细信息<br>
            <small style="color: #999; font-size: 12px;">
                提示：选中树后可使用方向键移动
            </small>
        </p>
    `;
    
    updateTreeList();
    drawing.draw();
}

// 显示状态消息
function showStatus(message, type = 'info') {
    // 简化状态显示
    console.log(`${type}: ${message}`);
}

// 导出UI函数
window.ui = {
    updateTreeList,
    selectTree,
    closeDetails,
    showStatus,
    updateTreeFromDetails
};