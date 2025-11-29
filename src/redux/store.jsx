/* eslint-disable import/prefer-default-export */
/* eslint-disable arrow-body-style */
/* eslint-disable import/order */
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import videoCall from './videoCall';
// import LeadSlice from './lead';

// Define the root reducer
const rootReducer = combineReducers({
    videoCall: videoCall,
});

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['videoCall'],
};

// Create the persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create the store
const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware => {
        return getDefaultMiddleware({
            serializableCheck: false
        });
    }
});

persistStore(store);

// Export the store
export { store };
