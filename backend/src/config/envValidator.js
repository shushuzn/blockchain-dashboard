const REQUIRED_ENV_VARS = [
  { name: 'JWT_SECRET', minLength: 32, sensitive: true },
  { name: 'ENCRYPTION_KEY', minLength: 32, sensitive: true },
]

const OPTIONAL_ENV_VARS = [
  { name: 'REDIS_URL', pattern: /^redis:\/\// },
  { name: 'NODE_ENV', pattern: /^(development|production|staging)$/ },
  { name: 'PORT', pattern: /^\d+$/ },
  { name: 'ALLOWED_ORIGINS', required: false },
  { name: 'DB_PATH', required: false },
]

const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /key/i,
  /token/i,
  /credential/i,
]

function validateEnvironment() {
  const errors = []
  const warnings = []

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.name]
    
    if (!value) {
      errors.push(`${envVar.name} is required but not set`)
      continue
    }

    if (envVar.minLength && value.length < envVar.minLength) {
      errors.push(`${envVar.name} must be at least ${envVar.minLength} characters`)
    }

    if (envVar.sensitive) {
      const commonDefaults = ['change-this-in-production', 'your-secret-key-here', 'secret', 'password']
      if (commonDefaults.some(pattern => value.toLowerCase().includes(pattern))) {
        errors.push(`${envVar.name} cannot be a default or placeholder value`)
      }
    }
  }

  for (const envVar of OPTIONAL_ENV_VARS) {
    const value = process.env[envVar.name]
    
    if (value && envVar.pattern && !envVar.pattern.test(value)) {
      warnings.push(`${envVar.name} has invalid format: ${value}`)
    }
  }

  const allVars = { ...process.env }
  for (const [key, value] of Object.entries(allVars)) {
    if (value && SENSITIVE_PATTERNS.some(p => p.test(key))) {
      if (value.length > 0 && !value.includes('*') && key !== 'JWT_SECRET' && key !== 'ENCRYPTION_KEY') {
        warnings.push(`Sensitive variable ${key} may be exposed in logs`)
      }
    }
  }

  if (errors.length > 0) {
    console.error('\n❌ Environment validation failed:')
    errors.forEach(e => console.error(`  - ${e}`))
    console.error('\n')
    throw new Error(`Environment validation failed: ${errors.join(', ')}`)
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment warnings:')
    warnings.forEach(w => console.warn(`  - ${w}`))
    console.warn('\n')
  }

  console.log('✅ Environment validation passed')
}

module.exports = { validateEnvironment, REQUIRED_ENV_VARS, OPTIONAL_ENV_VARS }
