import { Model } from "../model";
import { QueryBuilder } from "../query-builder";
import { Relation } from "./relation";

export class HasMany extends Relation {
  constructor(
    public query: QueryBuilder,
    public parent: Model,
    public foreignKey: string,
    public ownerKey: string,
    public relationName: string
  ) {
    super(query);
  }

  save(models: any[]) {
    return Promise.all(
      models.map(async (model) => {
        model[this.foreignKey as keyof Model] =
          this.parent[this.ownerKey as keyof Model];
        await model.save();
        return model;
      })
    );
  }

  create(attributeSets: Record<string, any>[]) {
    return Promise.all(
      attributeSets.map(async (attributes) => {
        const model = new this.query.modelInstance.constructor(attributes);
        model[this.foreignKey as keyof Model] =
          this.parent[this.ownerKey as keyof Model];
        await model.save();
        return model;
      })
    );
  }

  addEagerConstraints(models: any[]): void {
    this.query.whereIn(
      this.foreignKey,
      models.map((model) => model[this.ownerKey as keyof Model])
    );
  }

  match(models: any[], results: any[], relationName: string): any {
    return models.map((model) => {
      model.setRelation(
        relationName,
        results.filter(
          (result) => result[this.foreignKey as keyof Model] === model.id
        )
      );

      return model;
    });
  }

  getResults(withConstraints = true) {
    if (withConstraints) {
      this.query.where(
        this.foreignKey,
        this.parent[this.ownerKey as keyof Model]
      );
    }

    return (
      this.query
        /**
         * Cache the results on the parent model.
         */
        .afterExecute((results) => {
          this.parent.setRelation(this.relationName, results);
        })
        .get()
    );
  }
}
