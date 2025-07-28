# Nx Monorepo Guide

## Overview

This project uses **Nx** for monorepo management, providing efficient build caching, dependency management, and project orchestration.

## Key Concepts

### Project Types

- **Applications**: Standalone services that can be built and deployed independently
- **Libraries**: Reusable code shared across applications
- **Root**: Workspace configuration and orchestration

### Project Structure

```
{workspace-root}/
├── apps/                         # Applications (microservices)
│   ├── {app-name}/              # Individual application
│   │   ├── src/                 # Source code
│   │   ├── project.json         # Nx project configuration
│   │   ├── webpack.config.js    # Build configuration
│   │   └── tsconfig.app.json    # TypeScript config
├── libs/                         # Shared libraries
│   ├── {lib-name}/              # Individual library
│   │   ├── src/                 # Source code
│   │   ├── project.json         # Nx project configuration
│   │   └── tsconfig.lib.json    # TypeScript config
├── nx.json                       # Workspace configuration
├── package.json                  # Root dependencies
└── tsconfig.json                 # Root TypeScript config
```

## Common Commands

### Project Discovery

```bash
# List all projects
nx show projects

# Show project details
nx show project {project-name}

# View dependency graph
nx graph
```

### Building

```bash
# Build specific project
nx build {project-name}

# Build all projects
nx run-many --target=build --all

# Build affected projects only
nx build affected

# Build with specific configuration
nx build {project-name} --configuration=production
```

### Development

```bash
# Serve specific project
nx serve {project-name}

# Serve with development configuration
nx serve {project-name} --configuration=development

# Serve multiple projects
nx run-many --target=serve --projects={project1},{project2}
```

### Testing

```bash
# Test specific project
nx test {project-name}

# Test all projects
nx run-many --target=test --all

# Test with coverage
nx test {project-name} --coverage

# Test in watch mode
nx test {project-name} --watch
```

### Linting

```bash
# Lint specific project
nx lint {project-name}

# Lint all projects
nx run-many --target=lint --all

# Fix linting issues
nx lint {project-name} --fix
```

## Project Configuration

### Application Configuration

Each application has a `project.json` file:

```json
{
	"name": "{app-name}",
	"sourceRoot": "apps/{app-name}/src",
	"projectType": "application",
	"targets": {
		"build": {
			"executor": "@nx/webpack:webpack",
			"options": {
				"target": "node",
				"compiler": "tsc",
				"outputPath": "dist/apps/{app-name}",
				"main": "apps/{app-name}/src/main.ts",
				"tsConfig": "apps/{app-name}/tsconfig.app.json"
			}
		},
		"serve": {
			"executor": "@nx/js:node",
			"options": {
				"buildTarget": "{app-name}:build"
			}
		},
		"test": {
			"executor": "@nx/vite:test",
			"options": {
				"passWithNoTests": true
			}
		}
	}
}
```

### Library Configuration

Each library has a `project.json` file:

```json
{
	"name": "{lib-name}",
	"sourceRoot": "libs/{lib-name}/src",
	"projectType": "library",
	"targets": {
		"build": {
			"executor": "@nx/js:tsc",
			"options": {
				"outputPath": "dist/libs/{lib-name}",
				"main": "libs/{lib-name}/src/index.ts",
				"tsConfig": "libs/{lib-name}/tsconfig.lib.json"
			}
		},
		"test": {
			"executor": "@nx/vite:test",
			"options": {
				"passWithNoTests": true
			}
		}
	}
}
```

## Path Aliases

### Configuration

Use path aliases for clean imports in your TypeScript configuration:

```json
{
	"compilerOptions": {
		"baseUrl": ".",
		"paths": {
			"@app/{lib-name}": ["libs/{lib-name}/src"],
			"@app/{lib-name}/*": ["libs/{lib-name}/src/*"]
		}
	}
}
```

### Usage

```typescript
// Instead of relative imports
import { ConfigModule } from '../../../libs/nest/modules';

// Use path aliases
import { ConfigModule } from '@app/nest/modules';
```

## Dependency Management

### Adding Dependencies

```bash
# Add to specific project
pnpm add {package-name} --filter {project-name}

# Add to all projects
pnpm add {package-name}

# Add dev dependency
pnpm add -D {package-name} --filter {project-name}
```

### Project Dependencies

Projects can depend on each other through the `project.json`:

```json
{
	"name": "{app-name}",
	"targets": {
		"build": {
			"executor": "@nx/webpack:webpack",
			"options": {
				"dependencies": [
					{
						"target": "build",
						"projects": "dependencies"
					}
				]
			}
		}
	}
}
```

## Caching

### Build Caching

Nx automatically caches build outputs:

```bash
# Check cache status
nx show project {project-name}

# Clear cache
nx reset

# View cache information
nx graph --file=graph.html
```

### Affected Commands

Only rebuild what's changed:

```bash
# Build affected projects
nx build affected

# Test affected projects
nx test affected

# Lint affected projects
nx lint affected
```

## Best Practices

### 1. Project Organization

- Keep applications in `apps/`
- Keep libraries in `libs/`
- Use descriptive project names
- Group related libraries together

### 2. Dependencies

- Minimize cross-project dependencies
- Use libraries for shared code
- Keep applications focused and lightweight

### 3. Configuration

- Use consistent naming conventions
- Configure path aliases for clean imports
- Set up proper build targets

### 4. Testing

- Test libraries independently
- Use integration tests for applications
- Maintain good test coverage

## Troubleshooting

### Common Issues

**Build Failures**: Check project dependencies and path configurations

**Cache Issues**: Clear cache with `nx reset`

**Path Resolution**: Verify TypeScript path aliases are configured correctly

**Dependency Issues**: Check `project.json` dependencies and package.json

### Debug Commands

```bash
# Show project graph
nx graph

# Show affected projects
nx affected:graph

# Show project details
nx show project {project-name}

# Run with verbose output
nx build {project-name} --verbose
```

## Migration from NestJS CLI

### Key Changes

1. **Project Configuration**: Moved from `nest-cli.json` to individual `project.json` files
2. **Build System**: Using Nx executors instead of NestJS CLI
3. **Path Resolution**: Using Nx path aliases instead of global TypeScript paths
4. **Scripts**: Using Nx commands instead of NestJS CLI commands

### Migration Checklist

- [ ] All projects have `project.json` files
- [ ] Path aliases configured in individual `tsconfig` files
- [ ] Build scripts updated to use Nx commands
- [ ] Dependencies properly configured
- [ ] Tests running with Nx executors
- [ ] Linting configured for all projects

## Next Steps

1. **Explore Projects**: Use `nx show projects` to understand the workspace
2. **Run Builds**: Test builds with `nx build {project-name}`
3. **Configure Paths**: Set up path aliases for clean imports
4. **Add Tests**: Ensure all projects have proper test configuration
5. **Optimize**: Use affected commands for efficient development
