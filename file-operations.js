// 文件操作模块

// 导出CSV
function exportCSV() {
    if (appState.trees.length === 0) {
        ui.showStatus('没有树可导出', 'warning');
        return;
    }
    
    let csv = 'id,x,y,deg\n';
    const treeCount = appState.trees.length;
    const groupId = String(treeCount).padStart(3, '0'); // 树的数量用3位数字表示，如 005
    
    appState.trees.forEach((tree, index) => {
        const treeId = `${groupId}_${index}`;
        // 使用完整精度，而不是 toFixed(6)
        // JavaScript 默认会以最大精度转换数字为字符串
        csv += `${treeId},s${tree.center_x},s${tree.center_y},s${tree.angle}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trees_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    ui.showStatus('CSV已导出');
}

// 导入CSV
function importCSV() {
    document.getElementById('csvInput').click();
}

// 初始化CSV文件上传
function initCSVUpload() {
    document.getElementById('csvInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const csv = event.target.result;
                const lines = csv.split('\n');
                
                // 清空现有树
                appState.trees = [];
                appState.selectedTree = null;
                
                // 解析CSV（跳过标题行）
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    const parts = line.split(',');
                    if (parts.length >= 4) {
                        // 移除's'前缀
                        const x = parts[1].startsWith('s') ? parts[1].substring(1) : parts[1];
                        const y = parts[2].startsWith('s') ? parts[2].substring(1) : parts[2];
                        const deg = parts[3].startsWith('s') ? parts[3].substring(1) : parts[3];
                        
                        const tree = new ChristmasTree(x, y, deg);
                        appState.trees.push(tree);
                    }
                }
                
                ui.updateTreeList();
                collision.checkCollisions();
                drawing.draw();
                ui.showStatus(`已导入 ${appState.trees.length} 棵树`);
                
                // 重置文件输入
                e.target.value = '';
            } catch (error) {
                ui.showStatus('导入失败: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    });
}

// 导出文件操作函数
window.fileOperations = {
    exportCSV,
    importCSV,
    initCSVUpload
};