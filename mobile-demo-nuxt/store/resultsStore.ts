import { defineStore } from 'pinia';
import type { DBResult } from '~/types/result.type';

export const useResultsStore = defineStore('results', {
  state: () => ({
    results: <DBResult[]>[],
    count: <number>0,
    filter: <number[]>[],
  }),
  actions: {
    setResults(results: DBResult[]) {
      this.results = results;
      this.count = results.length;
    },
    setFilter(filter: number[]) {
      this.filter = filter;
    },
  },
});
