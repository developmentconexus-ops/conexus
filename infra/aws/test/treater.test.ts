import assert from 'node:assert/strict'
import { test } from 'node:test'
import { allows, allowsWithin, asked, refusedGlueResources } from './iam.ts'
import { CHANGE, lake, roleOf } from './lake-model.ts'
import {
  ACCOUNT,
  actionsOf,
  find,
  REGION,
  readable,
  resourcesOf,
  statementsOf,
  trustOf,
} from './policies.ts'

test('o papel que trata nasce com o teto, a etiqueta da empresa e a confiança do que escreve', () => {
  const treater = find(lake, 'Treater')
  assert.partialDeepStrictEqual(treater.Properties, {
    RoleName: 'conexus-{LakeId}-tratador',
    PermissionsBoundary: `arn:aws:iam::${ACCOUNT}:policy/conexus-limite`,
    Tags: [{ Key: 'conexus-empresa', Value: '{CompanyId}' }],
  })
  assert.deepEqual(trustOf(treater), trustOf(find(lake, 'Writer')))
})

test('o papel que trata tem só as permissões da lista medida', () => {
  const treater = find(lake, 'Treater')
  const glue = `arn:aws:glue:${REGION}:${ACCOUNT}`
  const catalog = 's3tablescatalog/conexus-{LakeId}'
  const chain = [`${glue}:catalog`, `${glue}:catalog/s3tablescatalog`, `${glue}:catalog/${catalog}`]
  const read = ['glue:GetDatabase', 'glue:GetTable', 'glue:GetTables']
  assert.deepEqual(
    statementsOf(treater).map((statement) => [
      statement.Sid,
      actionsOf(statement),
      resourcesOf(statement),
      statement.Condition,
    ]),
    [
      ['ListTheAccountDatabases', ['glue:GetDatabases'], [`${glue}:catalog`], undefined],
      ['TheCompanyCatalogChain', ['glue:GetCatalog', ...read, ...CHANGE], chain, undefined],
      [
        'OpenTheTreatedAreas',
        [...read, ...CHANGE],
        [`${glue}:database/${catalog}/tratado`, `${glue}:database/${catalog}/negocio`],
        undefined,
      ],
      [
        'ChangeTheTreatedTables',
        ['glue:GetTable', 'glue:GetTables', ...CHANGE],
        [`${glue}:table/${catalog}/tratado/*`, `${glue}:table/${catalog}/negocio/*`],
        undefined,
      ],
      [
        'ReadTheCurrentTables',
        ['glue:GetDatabase', 'glue:GetTable'],
        [`${glue}:database/${catalog}/current`, `${glue}:table/${catalog}/current/*`],
        undefined,
      ],
      [undefined, ['lakeformation:GetDataAccess'], ['*'], undefined],
      [
        'QueryInTheTreatmentWorkGroup',
        ['athena:StartQueryExecution', 'athena:GetQueryExecution', 'athena:GetQueryResults'],
        [`arn:aws:athena:${REGION}:${ACCOUNT}:workgroup/conexus-{LakeId}-tratamento`],
        undefined,
      ],
      [
        'ReadTheCompanyTreatment',
        ['s3:GetObject'],
        [`arn:aws:s3:::conexus-estado-${ACCOUNT}-${REGION}/tratamento/{CompanyId}/*`],
        undefined,
      ],
      [
        'SendTheResult',
        ['sqs:SendMessage'],
        [`arn:aws:sqs:${REGION}:${ACCOUNT}:conexus-copia-fim`],
        undefined,
      ],
    ],
  )
})

test('o que trata não toca raw, não muda current, não lê parâmetro nem outra empresa', () => {
  const company = 'EmpresaTesteA0000000000000000001'
  const treater = roleOf('Treater', 'lagodeaaaaaa', company)
  const boundary = statementsOf(find(readable('platform'), 'Boundary'))
  const bucket = 'conexus-lagodeaaaaaa'
  for (const area of ['tratado', 'negocio']) {
    for (const action of CHANGE) {
      const call = { action, bucket, area }
      assert.deepEqual(refusedGlueResources(treater, call), [], `${action} ${area}`)
      assert.deepEqual(refusedGlueResources(boundary, call), [], `${action} ${area}`)
    }
  }
  const glue = `arn:aws:glue:${REGION}:${ACCOUNT}`
  const own = `s3tablescatalog/${bucket}`
  for (const area of ['raw', 'current']) {
    for (const action of CHANGE) {
      assert.deepEqual(
        refusedGlueResources(treater, { action, bucket, area }),
        [`${glue}:database/${own}/${area}`, `${glue}:table/${own}/${area}/notas`],
        `${action} ${area}`,
      )
    }
  }
  const raw = `${glue}:table/s3tablescatalog/${bucket}/raw/notas`
  assert.equal(allows(treater, asked('glue:GetTable', raw)), false)
  const ssm = `arn:aws:ssm:${REGION}:${ACCOUNT}:parameter/conexus/copia/${company}/rodada`
  assert.equal(allows(treater, asked('ssm:GetParameter', ssm)), false)
  const state = `arn:aws:s3:::conexus-estado-${ACCOUNT}-${REGION}`
  const other = 'EmpresaTesteB0000000000000000002'
  const spec = `${state}/tratamento/${company}/rodada.json`
  assert.equal(allowsWithin(treater, boundary, asked('s3:GetObject', spec)), true)
  const refused = [
    asked('s3:GetObject', `${state}/tratamento/${other}/rodada.json`),
    asked('s3:GetObject', `${state}/${company}/ligacao/state.json`),
    asked('s3:PutObject', spec),
    asked('s3:DeleteObject', spec),
  ]
  for (const call of refused) {
    assert.equal(allows(treater, call), false, `${call.action} ${call.resource}`)
  }
  const workgroup = `arn:aws:athena:${REGION}:${ACCOUNT}:workgroup/${bucket}`
  assert.equal(allows(treater, asked('athena:StartQueryExecution', workgroup)), false)
  assert.ok(!treater.flatMap(actionsOf).some((action) => /^(s3tables|ssm|iam|sts):/.test(action)))
})

test('o que trata acha o banco current, e não o raw: a tabela que falta volta como ausente, não como acesso negado', () => {
  const treater = roleOf('Treater', 'lagodeaaaaaa', 'EmpresaTesteA0000000000000000001')
  const boundary = statementsOf(find(readable('platform'), 'Boundary'))
  function database(area: string) {
    const catalog = 's3tablescatalog/conexus-lagodeaaaaaa'
    return asked(
      'glue:GetDatabase',
      `arn:aws:glue:${REGION}:${ACCOUNT}:database/${catalog}/${area}`,
    )
  }
  assert.equal(allowsWithin(treater, boundary, database('current')), true)
  assert.equal(allows(treater, database('raw')), false)
})

test('o que trata lê current e cria em tratado e negocio pelo Lake Formation, e nada em raw', () => {
  const principal = { DataLakePrincipalIdentifier: '<Treater.Arn>' }
  const catalogId = `${ACCOUNT}:s3tablescatalog/conexus-{LakeId}`
  const grants = Object.values(lake)
    .map((resource) => resource.Properties)
    .filter((properties) => JSON.stringify(properties.Principal) === JSON.stringify(principal))
  function database(name: string) {
    return { Database: { CatalogId: catalogId, Name: name } }
  }
  function granted(resource: unknown, permissions: string[]) {
    return {
      Permissions: permissions,
      PermissionsWithGrantOption: [],
      Principal: principal,
      Resource: resource,
    }
  }
  assert.deepEqual(grants, [
    granted(database('current'), ['DESCRIBE']),
    granted({ Table: { CatalogId: catalogId, DatabaseName: 'current', TableWildcard: {} } }, [
      'SELECT',
      'DESCRIBE',
    ]),
    granted(database('tratado'), ['DESCRIBE', 'CREATE_TABLE']),
    granted(database('negocio'), ['DESCRIBE', 'CREATE_TABLE']),
  ])
  assert.deepEqual(find(lake, 'TreatWorkGroup').Properties, {
    Name: 'conexus-{LakeId}-tratamento',
    RecursiveDeleteOption: true,
    WorkGroupConfiguration: {
      EnforceWorkGroupConfiguration: true,
      PublishCloudWatchMetricsEnabled: false,
      BytesScannedCutoffPerQuery: 10 * 1024 ** 3,
      EngineVersion: { SelectedEngineVersion: 'AUTO' },
      ManagedQueryResultsConfiguration: { Enabled: true },
    },
  })
})
