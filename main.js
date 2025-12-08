// 主入口文件

// 全局应用状态
let appState;

// 初始化应用
function initApp() {
    // 创建应用状态实例
    appState = new AppState();
    
    // 初始化画布
    canvasInit.initCanvas();
    
    // 初始化交互事件
    interaction.initInteractions();
    
    // 添加一些示例树（延迟执行）
    setTimeout(() => {
        treeOperations.addExampleTrees();
    }, 1000);
}

// 导出全局应用状态
window.getAppState = () => appState;

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

// 暴露主要函数到全局作用域，供HTML按钮调用
window.addTree = treeOperations.addTree;
window.addRandomTree = treeOperations.addRandomTree;
window.removeSelectedTree = treeOperations.removeSelectedTree;
window.clearAllTrees = treeOperations.clearAllTrees;
window.exportCSV = fileOperations.exportCSV;
window.importCSV = fileOperations.importCSV;
window.centerView = canvasInit.centerView;
window.toggleGrid = drawing.toggleGrid;
window.zoomIn = canvasInit.zoomIn;
window.zoomOut = canvasInit.zoomOut;