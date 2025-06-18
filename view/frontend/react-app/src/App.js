import React from 'react';
import ProductView from './components/ProductView';
import './App.css';

function App() {

    const productSku = '24-MB01';

    return (
        <div className="App">
            <header className="App-header">
            </header>
            <main>
                <ProductView sku={productSku} />
            </main>
        </div>
    );
}

export default App;
