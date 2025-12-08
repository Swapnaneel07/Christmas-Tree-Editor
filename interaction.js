// 交互事件模块

// 初始化交互事件
function initInteractions() {
    const canvas = document.getElementById('treeCanvas');
    
    // 鼠标事件
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('wheel', handleMouseWheel);
    
    // 窗口大小改变事件
    window.addEventListener('resize', () => {
        const canvas = document.getElementById('treeCanvas');
        const oldWidth = canvas.width;
        const oldHeight = canvas.height;
        
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // 调整偏移量以保持视口位置
        const scaleX = canvas.width / oldWidth;
        const scaleY = canvas.height / oldHeight;
        appState.offsetX *= scaleX;
        appState.offsetY *= scaleY;
        
        window.drawing.draw();
    });
    
    // 初始化CSV上传
    fileOperations.initCSVUpload();

    document.addEventListener('keydown', handleKeyDown);
}

// 新增：键盘事件处理
function handleKeyDown(e) {
    // 按下 Delete 或 Backspace 键时删除选中的树
    if ((e.key === 'Delete' || e.key === 'Backspace') && appState.selectedTree) {
        e.preventDefault(); // 阻止浏览器默认行为（如返回上一页）
        treeOperations.removeSelectedTree();
    }
    
    // 方向键移动选中的树
    if (appState.selectedTree && !appState.isDraggingView && !appState.isDraggingTree && !appState.isRotatingTree) {
        let direction = null;
        
        switch(e.key) {
            case 'ArrowUp':
                direction = 'up';
                break;
            case 'ArrowDown':
                direction = 'down';
                break;
            case 'ArrowLeft':
                direction = 'left';
                break;
            case 'ArrowRight':
                direction = 'right';
                break;
        }
        
        if (direction) {
            e.preventDefault(); // 防止页面滚动
            treeOperations.moveTreeToFarthest(appState.selectedTree, direction);
        }
    }
}

// 鼠标按下事件
function handleMouseDown(e) {
    const canvas = document.getElementById('treeCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 检查是否点击了旋转手柄（只有选中的树才有旋转手柄）
    if (appState.selectedTree) {
        const isOnRotationHandle = appState.selectedTree.isPointOnRotationHandle(
            x, y, appState.zoom, appState.offsetX, appState.offsetY
        );
        
        if (isOnRotationHandle) {
            // 开始旋转树
            appState.isRotatingTree = true;
            appState.selectedTree.isBeingRotated = true;
            
            // 记录起始角度
            appState.dragStartAngle = appState.selectedTree.angle;
            
            // 记录起始鼠标位置和角度
            appState.dragStartX = x;
            appState.dragStartY = y;
            appState.prevAngle = appState.selectedTree.angle; // 新增：记录上一帧的角度
            
            // 记录树的中心点屏幕坐标
            appState.rotationCenterX = appState.selectedTree.center_x * appState.zoom + appState.offsetX;
            appState.rotationCenterY = -appState.selectedTree.center_y * appState.zoom + appState.offsetY;
            
            canvas.style.cursor = 'grabbing';
            window.drawing.draw(); // 立即更新显示
            return;
        }
    }
    
    // 检查是否点击了树
    const clickedTree = window.canvasInit.findTreeAtPoint(x, y);
    
    if (clickedTree) {
        // 开始拖动树
        appState.isDraggingTree = true;
        appState.draggedTree = clickedTree;
        
        // 记录拖动的起始位置（世界坐标）
        appState.dragStartWorldX = (x - appState.offsetX) / appState.zoom;
        appState.dragStartWorldY = -(y - appState.offsetY) / appState.zoom; // Y坐标取反
        
        // 记录树的当前位置
        appState.dragStartTreeX = clickedTree.center_x;
        appState.dragStartTreeY = clickedTree.center_y;
        
        // 设置树的拖动状态
        clickedTree.isBeingDragged = true;
        
        // 选中该树（如果不是已经选中的）
        if (appState.selectedTree !== clickedTree) {
            ui.selectTree(clickedTree);
        }
        
        canvas.style.cursor = 'grabbing';
    } else {
        // 如果没有点击到树，开始拖动视图
        appState.isDraggingView = true;
        appState.dragStartX = x;
        appState.dragStartY = y;
        appState.originalOffsetX = appState.offsetX;
        appState.originalOffsetY = appState.offsetY;
        
        // 清除树的选中状态（如果在空白处点击）
        if (appState.selectedTree) {
            ui.closeDetails();
        }
        
        canvas.style.cursor = 'grabbing';
    }
}

// 鼠标移动事件
function handleMouseMove(e) {
    const canvas = document.getElementById('treeCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (appState.isRotatingTree && appState.selectedTree) {
        // 旋转树
        // 计算从中心到起始点的向量
        const startVectorX = appState.dragStartX - appState.rotationCenterX;
        const startVectorY = appState.dragStartY - appState.rotationCenterY;
        
        // 计算从中心到当前点的向量
        const currentVectorX = x - appState.rotationCenterX;
        const currentVectorY = y - appState.rotationCenterY;
        
        // 计算角度（弧度）
        const startAngle = Math.atan2(startVectorY, startVectorX);
        const currentAngle = Math.atan2(currentVectorY, currentVectorX);
        
        // 计算角度差（弧度）
        let angleDeltaRad = currentAngle - startAngle;
        
        // 修正角度差，避免跨越π边界时的跳变
        if (angleDeltaRad > Math.PI) {
            angleDeltaRad -= 2 * Math.PI;
        } else if (angleDeltaRad < -Math.PI) {
            angleDeltaRad += 2 * Math.PI;
        }
        
        // 转换为角度并反转方向（使旋转符合直觉）
        let angleDelta = -angleDeltaRad * 180 / Math.PI;
        
        // 应用灵敏度调节（可选）
        angleDelta *= 1.0; // 可以调整这个值来控制旋转速度
        
        // 计算新角度
        let newAngle = appState.dragStartAngle + angleDelta;
        
        // 标准化角度到0-360度范围
        newAngle = newAngle % 360;
        if (newAngle < 0) newAngle += 360;
        
        // 使用更智能的角度更新，避免跳变
        if (Math.abs(newAngle - appState.selectedTree.angle) < 300) { // 避免大的跳变
            appState.selectedTree.updateAngle(newAngle);
            appState.prevAngle = newAngle; // 更新上一帧的角度
        } else {
            // 如果检测到大的跳变，使用上一帧的角度加上小的增量
            const smallDelta = angleDelta % 360;
            if (smallDelta > 180) smallDelta -= 360;
            if (smallDelta < -180) smallDelta += 360;
            newAngle = appState.prevAngle + smallDelta;
            newAngle = newAngle % 360;
            if (newAngle < 0) newAngle += 360;
            appState.selectedTree.updateAngle(newAngle);
            appState.prevAngle = newAngle;
        }
        
        // 更新详细信息面板
        updateDetailsPanelDuringRotation();
        
        // 重绘画布
        window.drawing.draw();
    } else if (appState.isDraggingView) {
        // 拖动视图
        appState.offsetX = appState.originalOffsetX + (x - appState.dragStartX);
        appState.offsetY = appState.originalOffsetY + (y - appState.dragStartY);
        window.drawing.draw();
    } else if (appState.isDraggingTree && appState.draggedTree) {
        // 拖动树
        // 计算新的世界坐标
        const newWorldX = (x - appState.offsetX) / appState.zoom;
        const newWorldY = -(y - appState.offsetY) / appState.zoom; // Y坐标取反
        
        // 计算相对于拖动起始位置的偏移量
        const deltaX = newWorldX - appState.dragStartWorldX;
        const deltaY = newWorldY - appState.dragStartWorldY;
        
        // 计算树的新位置
        const newTreeX = appState.dragStartTreeX + deltaX;
        const newTreeY = appState.dragStartTreeY + deltaY;
        
        // 更新树的位置
        appState.draggedTree.updatePosition(newTreeX, newTreeY);
        
        // 更新详细信息面板
        updateDetailsPanelDuringDrag();
        
        // 重绘画布
        window.drawing.draw();
    } else {
        // 检查鼠标悬停
        if (appState.selectedTree) {
            const isOnRotationHandle = appState.selectedTree.isPointOnRotationHandle(
                x, y, appState.zoom, appState.offsetX, appState.offsetY
            );
            if (isOnRotationHandle) {
                canvas.style.cursor = 'grab';
                return;
            }
        }
        
        const hoveredTree = window.canvasInit.findTreeAtPoint(x, y);
        canvas.style.cursor = hoveredTree ? 'move' : 'crosshair';
    }
}

// 鼠标释放事件
function handleMouseUp() {
    const canvas = document.getElementById('treeCanvas');
    
    if (appState.isRotatingTree && appState.selectedTree) {
        // 结束树的旋转
        appState.selectedTree.isBeingRotated = false;
        
        // 更新UI和碰撞检测
        ui.updateTreeList();
        collision.checkCollisions();
        window.boundingBox.updateStats();
        
        // 更新详细信息面板
        updateDetailsPanelAfterRotation();
        
        appState.isRotatingTree = false;
        ui.showStatus('树已旋转');
    } else if (appState.isDraggingTree && appState.draggedTree) {
        // 结束树的拖动
        appState.draggedTree.isBeingDragged = false;
        
        // 更新UI和碰撞检测
        ui.updateTreeList();
        collision.checkCollisions();
        window.boundingBox.updateStats();
        
        // 更新详细信息面板
        updateDetailsPanelAfterDrag();
        
        appState.draggedTree = null;
        ui.showStatus('树已移动');
    }
    
    // 重置所有拖动状态
    appState.isDraggingView = false;
    appState.isDraggingTree = false;
    
    // 更新光标
    updateCursor(canvas, event);
}

// 鼠标离开事件
function handleMouseLeave() {
    const canvas = document.getElementById('treeCanvas');
    
    // 结束旋转（如果正在进行）
    if (appState.isRotatingTree && appState.selectedTree) {
        appState.selectedTree.isBeingRotated = false;
        appState.isRotatingTree = false;
        
        // 更新UI和碰撞检测
        ui.updateTreeList();
        collision.checkCollisions();
        window.boundingBox.updateStats();
    }
    
    // 结束拖动（如果正在进行）
    if (appState.isDraggingTree && appState.draggedTree) {
        appState.draggedTree.isBeingDragged = false;
        appState.draggedTree = null;
        
        // 更新UI和碰撞检测
        ui.updateTreeList();
        collision.checkCollisions();
        window.boundingBox.updateStats();
    }
    
    appState.isDraggingView = false;
    appState.isDraggingTree = false;
    canvas.style.cursor = 'crosshair';
}

// 鼠标滚轮事件
function handleMouseWheel(e) {
    e.preventDefault();
    
    const canvas = document.getElementById('treeCanvas');
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 确定缩放方向
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    
    // 计算鼠标位置在世界坐标中的位置
    const worldX = (mouseX - appState.offsetX) / appState.zoom;
    const worldY = (mouseY - appState.offsetY) / appState.zoom;
    
    // 应用缩放
    const oldZoom = appState.zoom;
    appState.zoom *= zoomFactor;
    appState.zoom = Math.max(0.00001, Math.min(10000000, appState.zoom)); // 限制缩放范围
    
    // 调整偏移量以保持鼠标位置不变
    appState.offsetX = mouseX - worldX * appState.zoom;
    appState.offsetY = mouseY - worldY * appState.zoom;
    
    window.drawing.draw();
}

// 更新光标样式
function updateCursor(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (appState.selectedTree) {
        const isOnRotationHandle = appState.selectedTree.isPointOnRotationHandle(
            x, y, appState.zoom, appState.offsetX, appState.offsetY
        );
        if (isOnRotationHandle) {
            canvas.style.cursor = 'grab';
            return;
        }
    }
    
    const hoveredTree = window.canvasInit.findTreeAtPoint(x, y);
    canvas.style.cursor = hoveredTree ? 'move' : 'crosshair';
}

// 拖动期间更新详细信息面板
function updateDetailsPanelDuringDrag() {
    if (!appState.draggedTree) return;
    
    const detailsPanel = document.getElementById('treeDetails');
    if (!detailsPanel) return;
    
    const xInput = document.getElementById('detailX');
    const yInput = document.getElementById('detailY');
    
    if (xInput) xInput.value = appState.draggedTree.center_x.toFixed(7);
    if (yInput) yInput.value = appState.draggedTree.center_y.toFixed(7);
}

// 拖动结束后更新详细信息面板
function updateDetailsPanelAfterDrag() {
    if (!appState.selectedTree) return;
    
    const xInput = document.getElementById('detailX');
    const yInput = document.getElementById('detailY');
    
    if (xInput) {
        xInput.value = appState.selectedTree.center_x;
        xInput.dispatchEvent(new Event('change'));
    }
    
    if (yInput) {
        yInput.value = appState.selectedTree.center_y;
        yInput.dispatchEvent(new Event('change'));
    }
}

// 旋转期间更新详细信息面板
function updateDetailsPanelDuringRotation() {
    if (!appState.selectedTree) return;
    
    const detailsPanel = document.getElementById('treeDetails');
    if (!detailsPanel) return;
    
    const angleInput = document.getElementById('detailAngle');
    
    if (angleInput) angleInput.value = appState.selectedTree.angle.toFixed(7);
}

// 旋转结束后更新详细信息面板
function updateDetailsPanelAfterRotation() {
    if (!appState.selectedTree) return;
    
    const angleInput = document.getElementById('detailAngle');
    
    if (angleInput) {
        angleInput.value = appState.selectedTree.angle;
        angleInput.dispatchEvent(new Event('change'));
    }
}

// 导出交互函数
window.interaction = {
    initInteractions,
    updateDetailsPanelDuringDrag,
    updateDetailsPanelAfterDrag,
    updateDetailsPanelDuringRotation,
    updateDetailsPanelAfterRotation
};