import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesStatement } from './sales-statement';

describe('SalesStatement', () => {
  let component: SalesStatement;
  let fixture: ComponentFixture<SalesStatement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesStatement],
    }).compileComponents();

    fixture = TestBed.createComponent(SalesStatement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
