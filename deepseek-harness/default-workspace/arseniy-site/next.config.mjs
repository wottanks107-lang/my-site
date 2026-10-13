/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Явно указываем корень проекта: иначе Next находит lockfile в родительской
  // папке и считает корнем её, из-за чего в сборку попадают лишние файлы.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
