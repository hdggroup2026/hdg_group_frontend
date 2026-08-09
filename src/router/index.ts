import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import LoginView from "@/components/auth/LoginView.vue";
import Dashboard from "@/views/dashboard/Dashboard.vue";
import NotFound from "@/views/error/NotFound.vue";

const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'login',
        component: LoginView,
        meta: { requiresAuth: false }
    },
    {
        path: '/register',
        name: 'register',
        component: LoginView,
        meta: { requiresAuth: false }
    },
    {
        path: '/forgot',
        name: 'forgot',
        component: LoginView,
        meta: { requiresAuth: false }
    },
    {
        path: '/tien-nga/:subview',
        name: 'tien-nga',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/ggomoosin/:subview',
        name: 'ggomoosin',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/rental/:subview',
        name: 'rental',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/credit/:subview',
        name: 'credit',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/harvest/:subview',
        name: 'harvest',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/other/:subview',
        name: 'other',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/telegram-projects/:subview',
        name: 'telegram-projects',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/rosca/:subview',
        name: 'rosca',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/authorization',
        name: 'authorization',
        component: Dashboard,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/',
        redirect: '/tien-nga/overall'
    },
    {
        path: '/overview',
        redirect: '/tien-nga/overall'
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: NotFound
    }
]

import { authService } from "@/api/auth";

const router = createRouter({
    history: createWebHistory(), // Using HTML5 History Mode
    routes
})

router.beforeEach(async (to, from, next) => {
    const isAuthenticated = authService.isAuthenticated();

    if (to.meta.requiresAuth && !isAuthenticated) {
        next({ name: 'login', query: { redirect: to.fullPath } });
    } else if ((to.name === 'login' || to.name === 'register' || to.name === 'forgot') && isAuthenticated) {
        next({ name: 'tien-nga', params: { subview: 'overall' } });
    } else if (to.meta.requiresAdmin) {
        const isAdmin = await authService.checkIsAdmin();
        if (isAdmin) {
            next();
        } else {
            next({ name: 'tien-nga', params: { subview: 'overall' } });
        }
    } else {
        next();
    }
});

export default router