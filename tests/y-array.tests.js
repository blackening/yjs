import { init, compare, applyRandomTests, Doc } from './testHelper.js' // eslint-disable-line

import * as Y from '../src/index.js'
import * as t from 'lib0/testing.js'
import * as prng from 'lib0/prng.js'

/**
 * @param {t.TestCase} tc
 */
export const testDeleteInsert = tc => {
  const { users, array0 } = init(tc, { users: 2 })
  array0.delete(0, 0)
  t.describe('Does not throw when deleting zero elements with position 0')
  t.fails(() => {
    array0.delete(1, 1)
  })
  array0.insert(0, ['A'])
  array0.delete(1, 0)
  t.describe('Does not throw when deleting zero elements with valid position 1')
  compare(users)
}

/**
 * @param {t.TestCase} tc
 */
export const testInsertThreeElementsTryRegetProperty = tc => {
  const { testConnector, users, array0, array1 } = init(tc, { users: 2 })
  array0.insert(0, [1, true, false])
  t.compare(array0.toJSON(), [1, true, false], '.toJSON() works')
  testConnector.flushAllMessages()
  t.compare(array1.toJSON(), [1, true, false], '.toJSON() works after sync')
  compare(users)
}

/**
 * @param {t.TestCase} tc
 */
export const testConcurrentInsertWithThreeConflicts = tc => {
  var { users, array0, array1, array2 } = init(tc, { users: 3 })
  array0.insert(0, [0])
  array1.insert(0, [1])
  array2.insert(0, [2])
  compare(users)
}

/**
 * @param {t.TestCase} tc
 */
export const testConcurrentInsertDeleteWithThreeConflicts = tc => {
  const { testConnector, users, array0, array1, array2 } = init(tc, { users: 3 })
  array0.insert(0, ['x', 'y', 'z'])
  testConnector.flushAllMessages()
  array0.insert(1, [0])
  array1.delete(0)
  array1.delete(1, 1)
  array2.insert(1, [2])
  compare(users)
}

/**
 * @param {t.TestCase} tc
 */
export const testInsertionsInLateSync = tc => {
  const { testConnector, users, array0, array1, array2 } = init(tc, { users: 3 })
  array0.insert(0, ['x', 'y'])
  testConnector.flushAllMessages()
  users[1].disconnect()
  users[2].disconnect()
  array0.insert(1, ['user0'])
  array1.insert(1, ['user1'])
  array2.insert(1, ['user2'])
  users[1].connect()
  users[2].connect()
  testConnector.flushAllMessages()
  compare(users)
}

/**
 * @param {t.TestCase} tc
 */
export const testDisconnectReallyPreventsSendingMessages = tc => {
  var { testConnector, users, array0, array1 } = init(tc, { users: 3 })
  array0.insert(0, ['x', 'y'])
  testConnector.flushAllMessages()
  users[1].disconnect()
  users[2].disconnect()
  array0.insert(1, ['user0'])
  array1.insert(1, ['user1'])
  t.compare(array0.toJSON(), ['x', 'user0', 'y'])
  t.compare(array1.toJSON(), ['x', 'user1', 'y'])
  users[1].connect()
  users[2].connect()
  compare(users)
}

/**
 * @param {t.TestCase} tc
 */
export const testDeletionsInLateSync = tc => {
  const { testConnector, users, array0, array1 } = init(tc, { users: 2 })
  array0.insert(0, ['x', 'y'])
  testConnector.flushAllMessages()
  users[1].disconnect()
  array1.delete(1, 1)
  array0.delete(0, 2)
  users[1].connect()
  compare(users)
}

/**
 * @param {t.TestCase} tc
 */
export const testInsertThenMergeDeleteOnSync = tc => {
  const { testConnector, users, array0, array1 } = init(tc, { users: 2 })
  array0.insert(0, ['x', 'y', 'z'])
  testConnector.flushAllMessages()
  users[0].disconnect()
  array1.delete(0, 3)
  users[0].connect()
  compare(users)
}

/**
 * @param {t.TestCase} tc
 */
export const testInsertAndDeleteEvents = tc => {
  const { array0, users } = init(tc, { users: 2 })
  /**
   * @type {Object<string,any>?}
   */
  let event = null
  array0.observe(e => {
    event = e
  })
  array0.insert(0, [0, 1, 2])
  t.assert(event !== null)
  event = null
  array0.delete(0)
  t.assert(event !== null)
  event = null
  array0.delete(0, 2)
  t.assert(event !== null)
  event = null
  compare(users)
}

/**
 * @param {t.TestCase} tc
 */
export const testNestedObserverEvents = tc => {
  const { array0, users } = init(tc, { users: 2 })
  /**
   * @type {Array<number>}
   */
  const vals = []
  array0.observe(e => {
    if (array0.length === 1) {
      // inserting, will call this observer again
      // we expect that this observer is called after this event handler finishedn
      array0.insert(1, [1])
      vals.push(0)
    } else {
      // this should be called the second time an element is inserted (above case)
      vals.push(1)
    }
  })
  array0.insert(0, [0])
  t.compareArrays(vals, [0, 1])
  t.compareArrays(array0.toArray(), [0, 1])
  compare(users)
}

/**
 * @param {t.TestCase} tc
 */
export const testInsertAndDeleteEventsForTypes = tc => {
  const { array0, users } = init(tc, { users: 2 })
  /**
   * @type {Object<string,any>|null}
   */
  let event = null
  array0.observe(e => {
    event = e
  })
  array0.insert(0, [new Y.Array()])
  t.assert(event !== null)
  event = null
  array0.delete(0)
  t.assert(event !== null)
  event = null
  compare(users)
}

/**
 * @param {t.TestCase} tc
 */
export const testInsertAndDeleteEventsForTypes2 = tc => {
  const { array0, users } = init(tc, { users: 2 })
  /**
   * @type {Array<Object<string,any>>}
   */
  let events = []
  array0.observe(e => {
    events.push(e)
  })
  array0.insert(0, ['hi', new Y.Map()])
  t.assert(events.length === 1, 'Event is triggered exactly once for insertion of two elements')
  array0.delete(1)
  t.assert(events.length === 2, 'Event is triggered exactly once for deletion')
  compare(users)
}

/**
 * This issue has been reported here https://github.com/y-js/yjs/issues/155
 * @param {t.TestCase} tc
 */
export const testNewChildDoesNotEmitEventInTransaction = tc => {
  const { array0, users } = init(tc, { users: 2 })
  let fired = false
  users[0].transact(() => {
    const newMap = new Y.Map()
    newMap.observe(() => {
      fired = true
    })
    array0.insert(0, [newMap])
    newMap.set('tst', 42)
  })
  t.assert(!fired, 'Event does not trigger')
}

/**
 * @param {t.TestCase} tc
 */
export const testGarbageCollector = tc => {
  const { testConnector, users, array0 } = init(tc, { users: 3 })
  array0.insert(0, ['x', 'y', 'z'])
  testConnector.flushAllMessages()
  users[0].disconnect()
  array0.delete(0, 3)
  users[0].connect()
  testConnector.flushAllMessages()
  compare(users)
}

/**
 * @param {t.TestCase} tc
 */
export const testEventTargetIsSetCorrectlyOnLocal = tc => {
  const { array0, users } = init(tc, { users: 3 })
  /**
   * @type {any}
   */
  let event
  array0.observe(e => {
    event = e
  })
  array0.insert(0, ['stuff'])
  t.assert(event.target === array0, '"target" property is set correctly')
  compare(users)
}

/**
 * @param {t.TestCase} tc
 */
export const testEventTargetIsSetCorrectlyOnRemote = tc => {
  const { testConnector, array0, array1, users } = init(tc, { users: 3 })
  /**
   * @type {any}
   */
  let event
  array0.observe(e => {
    event = e
  })
  array1.insert(0, ['stuff'])
  testConnector.flushAllMessages()
  t.assert(event.target === array0, '"target" property is set correctly')
  compare(users)
}

/**
 * @param {t.TestCase} tc
 */
export const testIteratingArrayContainingTypes = tc => {
  const y = new Y.Doc()
  const arr = y.getArray('arr')
  const numItems = 10
  for (let i = 0; i < numItems; i++) {
    const map = new Y.Map()
    map.set('value', i)
    arr.push([map])
  }
  let cnt = 0
  for (let item of arr) {
    t.assert(item.get('value') === cnt++, 'value is correct')
  }
  y.destroy()
}

let _uniqueNumber = 0
const getUniqueNumber = () => _uniqueNumber++

/**
 * @type {Array<function(Doc,prng.PRNG,any):void>}
 */
const arrayTransactions = [
  function insert (user, gen) {
    const yarray = user.getArray('array')
    var uniqueNumber = getUniqueNumber()
    var content = []
    var len = prng.int31(gen, 1, 4)
    for (var i = 0; i < len; i++) {
      content.push(uniqueNumber)
    }
    var pos = prng.int31(gen, 0, yarray.length)
    yarray.insert(pos, content)
  },
  function insertTypeArray (user, gen) {
    const yarray = user.getArray('array')
    var pos = prng.int31(gen, 0, yarray.length)
    yarray.insert(pos, [new Y.Array()])
    var array2 = yarray.get(pos)
    array2.insert(0, [1, 2, 3, 4])
  },
  function insertTypeMap (user, gen) {
    const yarray = user.getArray('array')
    var pos = prng.int31(gen, 0, yarray.length)
    yarray.insert(pos, [new Y.Map()])
    var map = yarray.get(pos)
    map.set('someprop', 42)
    map.set('someprop', 43)
    map.set('someprop', 44)
  },
  function _delete (user, gen) {
    const yarray = user.getArray('array')
    var length = yarray.length
    if (length > 0) {
      var somePos = prng.int31(gen, 0, length - 1)
      var delLength = prng.int31(gen, 1, Math.min(2, length - somePos))
      if (prng.bool(gen)) {
        var type = yarray.get(somePos)
        if (type.length > 0) {
          somePos = prng.int31(gen, 0, type.length - 1)
          delLength = prng.int31(gen, 0, Math.min(2, type.length - somePos))
          type.delete(somePos, delLength)
        }
      } else {
        yarray.delete(somePos, delLength)
      }
    }
  }
]

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGeneratingYarrayTests4 = tc => {
  applyRandomTests(tc, arrayTransactions, 4)
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGeneratingYarrayTests40 = tc => {
  applyRandomTests(tc, arrayTransactions, 40)
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGeneratingYarrayTests42 = tc => {
  applyRandomTests(tc, arrayTransactions, 42)
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGeneratingYarrayTests43 = tc => {
  applyRandomTests(tc, arrayTransactions, 43)
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGeneratingYarrayTests44 = tc => {
  applyRandomTests(tc, arrayTransactions, 44)
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGeneratingYarrayTests45 = tc => {
  applyRandomTests(tc, arrayTransactions, 45)
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGeneratingYarrayTests46 = tc => {
  applyRandomTests(tc, arrayTransactions, 46)
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGeneratingYarrayTests300 = tc => {
  applyRandomTests(tc, arrayTransactions, 300)
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGeneratingYarrayTests400 = tc => {
  applyRandomTests(tc, arrayTransactions, 400)
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGeneratingYarrayTests500 = tc => {
  applyRandomTests(tc, arrayTransactions, 500)
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGeneratingYarrayTests600 = tc => {
  applyRandomTests(tc, arrayTransactions, 600)
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGeneratingYarrayTests1000 = tc => {
  applyRandomTests(tc, arrayTransactions, 1000)
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGeneratingYarrayTests1800 = tc => {
  applyRandomTests(tc, arrayTransactions, 1800)
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGeneratingYarrayTests3000 = tc => {
  t.skip(!t.production)
  applyRandomTests(tc, arrayTransactions, 3000)
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGeneratingYarrayTests5000 = tc => {
  t.skip(!t.production)
  applyRandomTests(tc, arrayTransactions, 5000)
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGeneratingYarrayTests30000 = tc => {
  t.skip(!t.production)
  applyRandomTests(tc, arrayTransactions, 30000)
}
