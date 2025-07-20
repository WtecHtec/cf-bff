module.exports = {
	apps: [
		{
			name: 'spec-code-worker',
			script: './pms/zhipu-server.js',
			instances: 'max', // 使用所有 CPU 核心
			exec_mode: 'cluster',
			env: {
				NODE_ENV: 'development',
				PORT: 3003
			},
			env_production: {
				NODE_ENV: 'production',
				PORT: 3004
			},
			// 日志配置
			log_file: './logs/combined.log',
			out_file: './logs/out.log',
			error_file: './logs/error.log',
			log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
			
			// 自动重启配置
			watch: false,
			ignore_watch: ['node_modules', 'logs'],
			max_memory_restart: '1G',
			
			// 进程管理
			min_uptime: '10s',
			max_restarts: 10,
			restart_delay: 4000,
			
			// 健康检查
			health_check_grace_period: 3000,
			health_check_fatal_exceptions: true,
			
			// 环境变量
			env_file: '.env'
		}
	],

	// 部署配置
	deploy: {
		production: {
			user: 'node',
			host: 'your-server-ip',
			ref: 'origin/main',
			repo: 'git@github.com:your-username/spec-code-worker.git',
			path: '/var/www/spec-code-worker',
			'pre-deploy-local': '',
			'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
			'pre-setup': ''
		}
	}
};