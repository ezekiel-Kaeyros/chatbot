"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenarioInput = void 0;
const class_validator_1 = require("class-validator");
class ScenarioInput {
    constructor() {
        this.times = -1;
    }
}
exports.ScenarioInput = ScenarioInput;
__decorate([
    (0, class_validator_1.Length)(3, 128),
    __metadata("design:type", String)
], ScenarioInput.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.Length)(15),
    __metadata("design:type", String)
], ScenarioInput.prototype, "phone_number_id", void 0);
__decorate([
    (0, class_validator_1.Length)(3),
    __metadata("design:type", String)
], ScenarioInput.prototype, "company", void 0);
//# sourceMappingURL=scenario-input.js.map